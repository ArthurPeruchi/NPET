from collections.abc import Sequence

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.database.models import Doacao, DoacaoDinheiro, Usuario


class UsuarioRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def list_all(self, skip: int = 0, limit: int = 50) -> Sequence[Usuario]:
        stmt = select(Usuario).order_by(Usuario.id_usuario).offset(skip).limit(limit)
        return self._db.scalars(stmt).all()

    def get_by_id(self, id_usuario: int) -> Usuario | None:
        return self._db.get(Usuario, id_usuario)

    def email_exists(self, email: str) -> bool:
        stmt = select(Usuario.id_usuario).where(Usuario.email == email)
        return self._db.scalar(stmt) is not None

    def cpf_exists(self, cpf: str) -> bool:
        stmt = select(Usuario.id_usuario).where(Usuario.cpf == cpf)
        return self._db.scalar(stmt) is not None

    def update(self, usuario: Usuario) -> Usuario:
        self._db.commit()
        self._db.refresh(usuario)
        return usuario

    def tem_doacoes(self, id_usuario: int) -> bool:
        stmt = select(Doacao.id_doacao).where(Doacao.id_usuario == id_usuario).limit(1)
        return self._db.scalar(stmt) is not None

    def desligar_recorrencias(self, id_usuario: int) -> None:
        """Desliga o lembrete mensal de todas as doações do usuário (sem commit)."""
        ids_doacoes = select(Doacao.id_doacao).where(Doacao.id_usuario == id_usuario)
        self._db.execute(
            update(DoacaoDinheiro)
            .where(DoacaoDinheiro.id_doacao.in_(ids_doacoes))
            .values(recorrente=False)
        )

    def instituicao_tem_doacoes(self, id_instituicao: int) -> bool:
        stmt = select(Doacao.id_doacao).where(Doacao.id_instituicao == id_instituicao).limit(1)
        return self._db.scalar(stmt) is not None

    def delete(self, usuario: Usuario) -> None:
        # A instituição (com redes sociais e necessidades, em cascata) sai junto com a conta.
        if usuario.instituicao is not None:
            self._db.delete(usuario.instituicao)
        self._db.delete(usuario)
        self._db.commit()