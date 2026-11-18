from __future__ import annotations

from datetime import time
from decimal import Decimal
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from pydantic.alias_generators import to_camel

from app.database.models import Prioridade, Unidade

if TYPE_CHECKING:
    from app.database.models import Instituicao, Necessidade

_ORDEM_PRIORIDADE = {Prioridade.alta: 0, Prioridade.media: 1, Prioridade.baixa: 2}


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class RedesSociais(CamelModel):
    facebook: str | None = None
    instagram: str | None = None
    email: str | None = None
    linkedin: str | None = None
    whatsapp: str | None = None
    site: str | None = None


class NecessidadeResponse(CamelModel):
    id: int
    nome: str
    descricao: str | None = None
    prioridade: Prioridade
    quantidade_meta: Decimal | None = None
    unidade: Unidade | None = None

    @classmethod
    def from_model(cls, n: Necessidade) -> NecessidadeResponse:
        return cls(
            id=n.id_necessidade,
            nome=n.nome_item,
            descricao=n.descricao,
            prioridade=n.prioridade,
            quantidade_meta=n.quantidade_meta,
            unidade=n.unidade,
        )


def _texto_necessidades(nomes: list[str]) -> str | None:
    """Monta "Ração, medicamentos e materiais de limpeza." a partir dos itens."""
    if not nomes:
        return None
    itens = [nomes[0]] + [n[:1].lower() + n[1:] for n in nomes[1:]]
    texto = itens[0] if len(itens) == 1 else f"{', '.join(itens[:-1])} e {itens[-1]}"
    return f"{texto}."


class InstituicaoCreate(CamelModel):
    nome: str = Field(min_length=1, max_length=100)
    email: EmailStr | None = None
    telefone: str | None = Field(default=None, max_length=20)
    logo: str | None = Field(default=None, max_length=255)
    cnpj: str | None = Field(default=None, pattern=r"^\d{14}$")
    cidade: str = Field(min_length=1, max_length=100)
    uf: str = Field(min_length=2, max_length=2)
    endereco: str | None = Field(default=None, max_length=255)
    descricao: str | None = Field(default=None, max_length=500)
    hora_abertura: time | None = None
    hora_fechamento: time | None = None
    horario_funcionamento: str | None = Field(default=None, max_length=100)
    qtd_animais: int | None = Field(default=None, ge=0)
    aceita_voluntarios: bool = False
    aceita_doacoes: bool = True

    @field_validator("uf")
    @classmethod
    def uf_maiuscula(cls, v: str) -> str:
        return v.upper()


class InstituicaoUpdate(CamelModel):
    nome: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = None
    telefone: str | None = Field(default=None, max_length=20)
    logo: str | None = Field(default=None, max_length=255)
    cnpj: str | None = Field(default=None, pattern=r"^\d{14}$")
    cidade: str | None = Field(default=None, min_length=1, max_length=100)
    uf: str | None = Field(default=None, min_length=2, max_length=2)
    endereco: str | None = Field(default=None, max_length=255)
    descricao: str | None = Field(default=None, max_length=500)
    hora_abertura: time | None = None
    hora_fechamento: time | None = None
    horario_funcionamento: str | None = Field(default=None, max_length=100)
    qtd_animais: int | None = Field(default=None, ge=0)
    aceita_voluntarios: bool | None = None
    aceita_doacoes: bool | None = None

    @field_validator("uf")
    @classmethod
    def uf_maiuscula(cls, v: str | None) -> str | None:
        return v.upper() if v else v


class InstituicaoResponse(CamelModel):
    id: int
    nome: str
    logo: str | None = None
    cnpj: str | None = None
    email: str | None = None
    telefone: str | None = None
    cidade: str
    uf: str
    endereco: str | None = None
    animais_sob_cuidado: int | None = None
    horario_funcionamento: str | None = None
    descricao: str | None = None
    principais_necessidades: str | None = None
    aceita_voluntarios: bool | None = None
    aceita_doacoes: bool
    redes_sociais: RedesSociais | None = None
    necessidades: list[NecessidadeResponse] | None = None

    @classmethod
    def from_model(cls, i: Instituicao) -> InstituicaoResponse:
        horario = i.horario_funcionamento
        if horario is None and i.hora_abertura and i.hora_fechamento:
            horario = f"{i.hora_abertura:%H:%M} - {i.hora_fechamento:%H:%M}"

        redes = (
            RedesSociais(**{r.plataforma.value: r.contato for r in i.redes_sociais})
            if i.redes_sociais
            else None
        )

        necessidades = sorted(
            i.necessidades,
            key=lambda n: (_ORDEM_PRIORIDADE[n.prioridade], n.id_necessidade),
        )

        return cls(
            id=i.id_instituicao,
            nome=i.nome,
            logo=i.logo,
            cnpj=i.cnpj,
            email=i.email,
            telefone=i.telefone,
            cidade=i.cidade,
            uf=i.uf,
            endereco=i.endereco,
            animais_sob_cuidado=i.qtd_animais,
            horario_funcionamento=horario,
            descricao=i.descricao,
            principais_necessidades=_texto_necessidades([n.nome_item for n in necessidades]),
            aceita_voluntarios=i.aceita_voluntarios,
            aceita_doacoes=i.aceita_doacoes,
            redes_sociais=redes,
            necessidades=[NecessidadeResponse.from_model(n) for n in necessidades] or None,
        )