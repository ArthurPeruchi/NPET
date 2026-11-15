from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database.models import Doacao, DoacaoDinheiro, TipoDoacao

_COM_DINHEIRO = (selectinload(Doacao.dinheiro),)


class DoacaoRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_id(self, id_doacao: int) -> Doacao | None:
        return self._db.get(Doacao, id_doacao, options=_COM_DINHEIRO)

    def get_by_mp_payment_id(self, mp_payment_id: str) -> Doacao | None:
        stmt = (
            select(Doacao)
            .join(Doacao.dinheiro)
            .options(*_COM_DINHEIRO)
            .where(DoacaoDinheiro.mp_payment_id == mp_payment_id)
        )
        return self._db.scalar(stmt)

    def list_monetarias_do_usuario(self, id_usuario: int) -> Sequence[Doacao]:
        stmt = (
            select(Doacao)
            .options(*_COM_DINHEIRO)
            .where(Doacao.id_usuario == id_usuario, Doacao.tipo_doacao == TipoDoacao.monetaria)
            .order_by(Doacao.criada_em.desc(), Doacao.id_doacao.desc())
        )
        return self._db.scalars(stmt).all()

    def create(self, doacao: Doacao) -> Doacao:
        self._db.add(doacao)
        self._db.commit()
        self._db.refresh(doacao)
        return doacao

    def save(self, doacao: Doacao) -> Doacao:
        self._db.commit()
        self._db.refresh(doacao)
        return doacao
