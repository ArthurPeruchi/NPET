from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import Instituicao, Usuario


class InstitutionAuthRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def email_exists(self, email: str) -> bool:
        return self._db.scalar(select(Usuario.id_usuario).where(Usuario.email == email)) is not None

    def cnpj_exists(self, cnpj: str) -> bool:
        return self._db.scalar(select(Instituicao.id_instituicao).where(Instituicao.cnpj == cnpj)) is not None

    def create(self, usuario: Usuario) -> Usuario:
        self._db.add(usuario)
        self._db.commit()
        self._db.refresh(usuario)
        return usuario
