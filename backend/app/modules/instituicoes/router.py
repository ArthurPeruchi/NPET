"""
Rotas REST de Instituições (camada Controller)

Só cuida de HTTP: chama o Service e devolve os DTOs. Nunca acessa o `fake_db.py` diretamente.
"""

from fastapi import APIRouter, Depends

from app.modules.instituicoes.repository import (
    InstituicaoRepository,
    get_instituicao_repository,
)
from app.modules.instituicoes.schemas import InstituicaoResponse
from app.modules.instituicoes.service import InstituicaoService

router = APIRouter(prefix="/instituicoes", tags=["instituicoes"])


def get_service(
    repository: InstituicaoRepository = Depends(get_instituicao_repository),
) -> InstituicaoService:
    return InstituicaoService(repository)


@router.get(
    "",
    response_model=list[InstituicaoResponse],
    response_model_exclude_none=True,
    summary="Lista todas as instituições",
)
async def listar(service: InstituicaoService = Depends(get_service)):
    return await service.listar()


@router.get(
    "/{instituicao_id}",
    response_model=InstituicaoResponse,
    response_model_exclude_none=True,
    summary="Busca uma instituição pelo id",
)
async def buscar_por_id(
    instituicao_id: int, service: InstituicaoService = Depends(get_service)
):
    return await service.buscar_por_id(instituicao_id)
