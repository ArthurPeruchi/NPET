from fastapi import APIRouter, Depends, Header, Request, Response

from app.core.config import settings
from app.core.exceptions import AppError, UnauthorizedError
from app.integrations.mercadopago import assinatura_webhook_valida
from app.modules.doacoes.router import get_service
from app.modules.doacoes.service import DoacaoService

router = APIRouter(prefix="/pagamentos", tags=["pagamentos"])


class WebhookNaoConfiguradoError(AppError):
    status_code = 503


@router.post(
    "/webhook",
    summary="Notificações do Mercado Pago (pública, validada pela assinatura x-signature)",
)
async def webhook_mercado_pago(
    request: Request,
    x_signature: str | None = Header(default=None),
    x_request_id: str | None = Header(default=None),
    service: DoacaoService = Depends(get_service),
):
    if not settings.MP_WEBHOOK_SECRET:
        raise WebhookNaoConfiguradoError("Webhook do Mercado Pago não configurado (MP_WEBHOOK_SECRET).")

    try:
        corpo = await request.json()
    except ValueError:
        corpo = {}
    if not isinstance(corpo, dict):
        corpo = {}

    tipo = request.query_params.get("type") or corpo.get("type")
    data_id = request.query_params.get("data.id") or (corpo.get("data") or {}).get("id")
    data_id = str(data_id) if data_id else None

    if not assinatura_webhook_valida(x_signature, x_request_id, data_id, settings.MP_WEBHOOK_SECRET):
        raise UnauthorizedError("Assinatura do webhook inválida.")

    # Outros tópicos (ex.: merchant_order) são ignorados com 200, para o MP não reenviar.
    if tipo == "payment" and data_id:
        service.processar_notificacao(data_id)
    return Response(status_code=200)
