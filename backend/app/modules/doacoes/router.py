from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.database.database import get_db
from app.database.models import TipoUsuario, Usuario
from app.integrations.mercadopago import MercadoPagoGateway, get_payment_gateway
from app.modules.doacoes.repository import DoacaoRepository
from app.modules.doacoes.schemas import (
    DoacaoMonetariaCreate,
    DoacaoMonetariaResponse,
    RecorrenciaUpdate,
)
from app.modules.doacoes.service import DoacaoService
from app.modules.instituicoes.repository import InstituicaoRepository

router = APIRouter(prefix="/doacoes", tags=["doacoes"])

require_doador = require_role(TipoUsuario.doador, mensagem="Apenas doadores podem fazer doações.")


def get_service(
    db: Session = Depends(get_db),
    gateway: MercadoPagoGateway = Depends(get_payment_gateway),
) -> DoacaoService:
    return DoacaoService(DoacaoRepository(db), InstituicaoRepository(db), gateway)


@router.post(
    "/monetarias",
    response_model=DoacaoMonetariaResponse,
    response_model_exclude_none=True,
    status_code=201,
    summary="Cria uma doação em dinheiro e o pagamento no Mercado Pago (doador)",
    responses={
        402: {"description": "Cartão recusado (a doação fica no histórico como cancelada)"},
        502: {"description": "Falha de comunicação com o Mercado Pago"},
    },
)
def criar_monetaria(
    data: DoacaoMonetariaCreate,
    doador: Usuario = Depends(require_doador),
    service: DoacaoService = Depends(get_service),
):
    return DoacaoMonetariaResponse.from_model(service.criar_monetaria(data, doador))


@router.get(
    "/me",
    response_model=list[DoacaoMonetariaResponse],
    response_model_exclude_none=True,
    summary="Histórico de doações do usuário logado (mais recentes primeiro)",
)
def minhas_doacoes(
    usuario: Usuario = Depends(get_current_user),
    service: DoacaoService = Depends(get_service),
):
    return [DoacaoMonetariaResponse.from_model(d) for d in service.listar_minhas(usuario)]


@router.get(
    "/{doacao_id}",
    response_model=DoacaoMonetariaResponse,
    response_model_exclude_none=True,
    summary="Detalhe de uma doação (dono ou admin); se pendente, consulta o Mercado Pago",
)
def detalhar(
    doacao_id: int,
    usuario: Usuario = Depends(get_current_user),
    service: DoacaoService = Depends(get_service),
):
    return DoacaoMonetariaResponse.from_model(service.detalhar(doacao_id, usuario))


@router.patch(
    "/{doacao_id}/recorrencia",
    response_model=DoacaoMonetariaResponse,
    response_model_exclude_none=True,
    summary="Liga ou desliga o lembrete de recorrência mensal (dono)",
)
def alterar_recorrencia(
    doacao_id: int,
    data: RecorrenciaUpdate,
    usuario: Usuario = Depends(get_current_user),
    service: DoacaoService = Depends(get_service),
):
    return DoacaoMonetariaResponse.from_model(
        service.alterar_recorrencia(doacao_id, data.recorrente, usuario)
    )


@router.patch(
    "/{doacao_id}/feedback-visto",
    response_model=DoacaoMonetariaResponse,
    response_model_exclude_none=True,
    summary="Marca o feedback da instituição como visto (dono)",
)
def marcar_feedback_visto(
    doacao_id: int,
    usuario: Usuario = Depends(get_current_user),
    service: DoacaoService = Depends(get_service),
):
    return DoacaoMonetariaResponse.from_model(service.marcar_feedback_visto(doacao_id, usuario))
