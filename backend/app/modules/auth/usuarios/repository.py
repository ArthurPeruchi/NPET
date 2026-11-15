from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.database.models import TokenRedefinicaoSenha, Usuario


class AuthRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def find_credential(self, email: str) -> Usuario | None:
        return self._db.scalar(select(Usuario).where(Usuario.email == email))

    def get_by_id(self, id_usuario: int) -> Usuario | None:
        return self._db.get(Usuario, id_usuario)

    def email_exists(self, email: str) -> bool:
        return self.find_credential(email) is not None

    def create(self, usuario: Usuario) -> Usuario:
        self._db.add(usuario)
        self._db.commit()
        self._db.refresh(usuario)
        return usuario

    # ---------- Redefinição de senha ----------

    def invalidate_reset_tokens(self, id_usuario: int, agora: datetime) -> None:
        """Marca como usados os tokens ainda abertos do usuário (sem commit)."""
        self._db.execute(
            update(TokenRedefinicaoSenha)
            .where(
                TokenRedefinicaoSenha.id_usuario == id_usuario,
                TokenRedefinicaoSenha.usado_em.is_(None),
            )
            .values(usado_em=agora)
        )

    def add_reset_token(self, token: TokenRedefinicaoSenha) -> None:
        self._db.add(token)
        self._db.commit()

    def find_reset_token(self, token_hash: str) -> TokenRedefinicaoSenha | None:
        return self._db.scalar(
            select(TokenRedefinicaoSenha).where(TokenRedefinicaoSenha.token_hash == token_hash)
        )

    def commit(self) -> None:
        self._db.commit()
