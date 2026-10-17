from typing import Any

from app.core.exceptions import NotFoundError
from app.modules.instituicoes.repository import InstituicaoRepository


class InstituicaoService:
    def __init__(self, repository: InstituicaoRepository) -> None:
        self._repository = repository

    async def listar(self) -> list[dict[str, Any]]:
        return await self._repository.get_all()

    async def buscar_por_id(self, instituicao_id: int) -> dict[str, Any]:
        instituicao = await self._repository.get_by_id(instituicao_id)
        if instituicao is None:
            raise NotFoundError("Instituição não encontrada.")
        return instituicao
