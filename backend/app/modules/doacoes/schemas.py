from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel

from app.database.models import FormaPagamento, StatusDoacao, TipoDoacao

if TYPE_CHECKING:
    from app.database.models import Doacao


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class DoacaoMonetariaCreate(CamelModel):
    id_instituicao: int = Field(gt=0)
    # Mesmos limites do formulário do frontend: R$ 1,00 a R$ 10.000,00.
    valor: Decimal = Field(ge=Decimal("1.00"), le=Decimal("10000.00"), decimal_places=2)
    forma_pagamento: FormaPagamento
    recorrente: bool = False

    # Somente cartão (gerados pelo SDK JS do Mercado Pago no navegador).
    card_token: str | None = Field(default=None, min_length=1, max_length=100)
    payment_method_id: str | None = Field(default=None, min_length=1, max_length=30)
    issuer_id: str | None = Field(default=None, max_length=30)
    cartao_final: str | None = Field(default=None, pattern=r"^\d{4}$")

    @model_validator(mode="after")
    def _dados_do_cartao(self) -> DoacaoMonetariaCreate:
        dados_cartao = (self.card_token, self.payment_method_id, self.issuer_id, self.cartao_final)
        if self.forma_pagamento == FormaPagamento.cartao_credito:
            if not (self.card_token and self.payment_method_id):
                raise ValueError("Pagamento com cartão exige cardToken e paymentMethodId.")
        elif any(dados_cartao):
            raise ValueError("Pagamento via PIX não aceita dados de cartão.")
        return self


class RecorrenciaUpdate(CamelModel):
    recorrente: bool


class PixResponse(CamelModel):
    qr_code: str
    expira_em: datetime | None = None


class DoacaoMonetariaResponse(CamelModel):
    """Mesmo formato de `DoacaoMonetaria` do frontend (camelCase)."""

    id: int
    id_usuario: int
    id_instituicao: int
    tipo_doacao: Literal[TipoDoacao.monetaria] = TipoDoacao.monetaria
    status: StatusDoacao
    criada_em: datetime
    confirmada_em: datetime | None = None  # data em que o pagamento foi aprovado (RNE-013)
    feedback: str | None = None
    feedback_visto: bool
    valor: float
    forma_pagamento: FormaPagamento
    recorrente: bool
    cartao_final: str | None = None
    pix: PixResponse | None = None  # só enquanto o PIX aguarda pagamento

    @classmethod
    def from_model(cls, d: Doacao) -> DoacaoMonetariaResponse:
        dinheiro = d.dinheiro
        pix = None
        if (
            dinheiro.forma_pagamento == FormaPagamento.pix
            and d.status == StatusDoacao.pendente
            and dinheiro.pix_qr_code
        ):
            pix = PixResponse(qr_code=dinheiro.pix_qr_code, expira_em=dinheiro.pix_expira_em)

        return cls(
            id=d.id_doacao,
            id_usuario=d.id_usuario,
            id_instituicao=d.id_instituicao,
            status=d.status,
            criada_em=d.criada_em,
            confirmada_em=d.confirmada_em,
            feedback=d.feedback_doacao,
            feedback_visto=d.feedback_visto,
            valor=float(dinheiro.valor),
            forma_pagamento=dinheiro.forma_pagamento,
            recorrente=dinheiro.recorrente,
            cartao_final=dinheiro.cartao_final,
            pix=pix,
        )
