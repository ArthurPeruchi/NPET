from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class RedesSociais(CamelModel):
    facebook: str | None = None
    instagram: str | None = None
    email: str | None = None
    linkedin: str | None = None
    whatsapp: str | None = None
    site: str | None = None


class InstituicaoResponse(CamelModel):
    id: int
    nome: str
    logo: str | None = None
    cnpj: str | None = None
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
