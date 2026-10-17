"""
Repositório de Instituições (camada Repository)

Único ponto que acessa o `fake_db.py`. Os métodos são assíncronos para que a troca por um ORM (ex.: SQLAlchemy/SQLModel com PostgreSQL) não altere a assinatura usada pelo Service.
"""

from copy import deepcopy
from typing import Any

from app.modules.instituicoes.fake_db import FAKE_INSTITUICOES_DB


class InstituicaoRepository:
    async def get_all(self) -> list[dict[str, Any]]:
        return deepcopy(FAKE_INSTITUICOES_DB)

    async def get_by_id(self, instituicao_id: int) -> dict[str, Any] | None:
        registro = next((i for i in FAKE_INSTITUICOES_DB if i["id"] == instituicao_id), None)
        return deepcopy(registro)


# Instância única usada pela injeção de dependência do FastAPI.
_repository = InstituicaoRepository()


def get_instituicao_repository() -> InstituicaoRepository:
    return _repository
