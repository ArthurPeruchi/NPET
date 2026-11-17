import hashlib
import hmac
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import httpx

from app.core.config import settings
from app.core.exceptions import PaymentGatewayError, UnprocessableError

logger = logging.getLogger(__name__)

# Respostas transitórias que valem nova tentativa; os demais 4xx são definitivos.
_STATUS_RETENTAVEIS = {429, 500, 502, 503, 504}

# Separado para os testes trocarem por uma espera nula.
_esperar = time.sleep


@dataclass
class PagamentoMP:
    """Recorte do pagamento devolvido pelo Mercado Pago com o que a NPET usa."""

    id: str
    status: str
    status_detail: str | None = None
    external_reference: str | None = None
    pix_qr_code: str | None = None
    pix_expira_em: datetime | None = None
    cartao_final: str | None = None

    @classmethod
    def from_api(cls, dados: dict) -> "PagamentoMP":
        transacao = (dados.get("point_of_interaction") or {}).get("transaction_data") or {}
        expira = dados.get("date_of_expiration")
        return cls(
            id=str(dados["id"]),
            status=dados.get("status") or "pending",
            status_detail=dados.get("status_detail"),
            external_reference=dados.get("external_reference"),
            pix_qr_code=transacao.get("qr_code"),
            pix_expira_em=datetime.fromisoformat(expira) if expira else None,
            cartao_final=(dados.get("card") or {}).get("last_four_digits"),
        )


class MercadoPagoGateway:
    def __init__(self, access_token: str | None = None, api_url: str | None = None) -> None:
        self._access_token = access_token if access_token is not None else settings.MP_ACCESS_TOKEN
        self._api_url = (api_url or settings.MP_API_URL).rstrip("/")

    # +---+ API pública +---+

    def create_pix_payment(
        self, *, id_doacao: int, valor: Decimal, descricao: str, email_pagador: str
    ) -> PagamentoMP:
        expira_em = datetime.now(timezone.utc) + timedelta(minutes=settings.MP_PIX_EXPIRATION_MINUTES)
        corpo = self._corpo_base(id_doacao, valor, descricao, email_pagador)
        corpo["payment_method_id"] = "pix"
        corpo["date_of_expiration"] = expira_em.isoformat(timespec="milliseconds")
        if settings.MP_PIX_TEST_APPROVAL:
            if settings.is_production:
                logger.warning("MP_PIX_TEST_APPROVAL ignorada: só vale fora de produção.")
            else:
                # Atalho do ambiente de teste do MP: pagador "APRO" aprova o PIX automaticamente.
                corpo["payer"]["first_name"] = "APRO"
        return self._criar(corpo, id_doacao)

    def create_card_payment(
        self,
        *,
        id_doacao: int,
        valor: Decimal,
        descricao: str,
        email_pagador: str,
        card_token: str,
        payment_method_id: str,
        issuer_id: str | None = None,
    ) -> PagamentoMP:
        corpo = self._corpo_base(id_doacao, valor, descricao, email_pagador)
        corpo.update(token=card_token, payment_method_id=payment_method_id, installments=1)
        if issuer_id:
            corpo["issuer_id"] = issuer_id
        return self._criar(corpo, id_doacao)

    def get_payment(self, payment_id: str) -> PagamentoMP:
        return PagamentoMP.from_api(self._request("GET", f"/v1/payments/{payment_id}"))

    # +---+ internos +---+

    @staticmethod
    def _corpo_base(id_doacao: int, valor: Decimal, descricao: str, email_pagador: str) -> dict:
        corpo = {
            "transaction_amount": float(valor),
            "description": descricao,
            "external_reference": str(id_doacao),
            "payer": {"email": email_pagador},
        }
        if settings.MP_NOTIFICATION_URL:
            corpo["notification_url"] = settings.MP_NOTIFICATION_URL
        return corpo

    def _criar(self, corpo: dict, id_doacao: int) -> PagamentoMP:
        # A chave fixa por doação impede cobrança em dobro se a requisição for repetida.
        cabecalhos = {"X-Idempotency-Key": f"npet-doacao-{id_doacao}"}
        return PagamentoMP.from_api(self._request("POST", "/v1/payments", json=corpo, headers=cabecalhos))

    def _request(self, metodo: str, caminho: str, **kwargs) -> dict:
        if not self._access_token:
            raise PaymentGatewayError("Pagamentos indisponíveis: o Mercado Pago não está configurado.")

        headers = {"Authorization": f"Bearer {self._access_token}", **kwargs.pop("headers", {})}
        timeout = httpx.Timeout(settings.MP_TIMEOUT_SECONDS, connect=settings.MP_CONNECT_TIMEOUT_SECONDS)
        tentativas = 1 + max(settings.MP_MAX_RETRIES, 0)

        # Repetir é seguro: a criação usa X-Idempotency-Key fixo por doação e a consulta só lê.
        for tentativa in range(1, tentativas + 1):
            ultima = tentativa == tentativas
            try:
                resposta = httpx.request(
                    metodo, f"{self._api_url}{caminho}", headers=headers, timeout=timeout, **kwargs
                )
            except httpx.HTTPError as exc:
                logger.warning(
                    "Falha de comunicação com o Mercado Pago (tentativa %s/%s): %s", tentativa, tentativas, exc
                )
                if ultima:
                    raise PaymentGatewayError(
                        "Não foi possível falar com o Mercado Pago. Tente novamente."
                    ) from exc
            else:
                if resposta.status_code not in _STATUS_RETENTAVEIS or ultima:
                    return self._tratar_resposta(resposta)
                logger.warning(
                    "Mercado Pago respondeu %s (tentativa %s/%s)", resposta.status_code, tentativa, tentativas
                )
            _esperar(settings.MP_RETRY_BACKOFF_SECONDS * 2 ** (tentativa - 1))

        raise AssertionError("inalcançável")  # o laço sempre retorna ou levanta na última tentativa

    @staticmethod
    def _tratar_resposta(resposta: httpx.Response) -> dict:
        if resposta.status_code == 400:
            # Ex.: card_token expirado/já usado ou dado inválido no pagamento.
            logger.warning("Mercado Pago recusou a requisição (400): %s", resposta.text)
            raise UnprocessableError("Dados de pagamento inválidos. Confira e tente novamente.")
        if resposta.status_code >= 300:
            logger.error("Erro do Mercado Pago (%s): %s", resposta.status_code, resposta.text)
            raise PaymentGatewayError("O Mercado Pago não conseguiu processar o pagamento. Tente novamente.")
        return resposta.json()


def get_payment_gateway() -> MercadoPagoGateway:
    """Dependência FastAPI; nos testes é trocada por um gateway falso."""
    return MercadoPagoGateway()


def assinatura_webhook_valida(
    x_signature: str | None, x_request_id: str | None, data_id: str | None, secret: str | None
) -> bool:
    """Valida o header x-signature ("ts=...,v1=...") enviado pelo Mercado Pago.

    Manifesto assinado (HMAC-SHA256 com a assinatura secreta do painel):
    "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
    """
    if not (x_signature and data_id and secret):
        return False

    partes = dict(
        parte.strip().split("=", 1) for parte in x_signature.split(",") if "=" in parte
    )
    ts, v1 = partes.get("ts"), partes.get("v1")
    if not (ts and v1):
        return False

    # O MP pede o data.id em minúsculas quando é alfanumérico.
    manifesto = f"id:{data_id.lower()};"
    if x_request_id:
        manifesto += f"request-id:{x_request_id};"
    manifesto += f"ts:{ts};"

    esperado = hmac.new(secret.encode(), manifesto.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(esperado, v1)
