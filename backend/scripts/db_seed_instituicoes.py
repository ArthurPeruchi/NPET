"""Popula o banco com as instituições que antes viviam no fake_db.py.

Uso (a partir de backend/, com o venv ativo e `alembic upgrade head` aplicado):
    python -m scripts.db_seed_instituicoes

Idempotente: cada instituição é identificada pelo e-mail do seu usuário; as que
já existirem são ignoradas. A senha dos usuários vem de SEED_PASSWORD no .env
(ou é pedida no terminal).
"""
import getpass
from typing import Any

from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.database.database import SessionLocal
from app.database.models import (
    Instituicao,
    Necessidade,
    Plataforma,
    Prioridade,
    RedeSocial,
    TipoUsuario,
    Usuario,
)

EMAIL_DOMINIO = "seed.npet.example.com"

INSTITUICOES: list[dict[str, Any]] = [
    {
        "slug": "unievangelica",
        "nome_usuario": "UniEVANGÉLICA",
        "nome": "UniEVANGÉLICA - Universidade Evangélica de Goiás",
        "logo": "/static/instituicoes/logoUni.png",
        "cidade": "Anápolis",
        "uf": "GO",
        "descricao": "Universidade parceira no desenvolvimento do projeto NPET.",
        "endereco": "Av. Universitária, s/n - Cidade Universitária, Anápolis - GO, 75083-515",
        "redes_sociais": {
            Plataforma.facebook: "https://www.facebook.com/aeeunievangelica",
            Plataforma.instagram: "https://www.instagram.com/unievangelica/",
        },
        "aceita_doacoes": False,
    },
    {
        "slug": "aspaan",
        "nome_usuario": "ASPAAN",
        "nome": "ASPAAN - Associação Protetora e Amiga dos Animais",
        "logo": "/static/instituicoes/logoASPAAN.png",
        "cidade": "Anápolis",
        "uf": "GO",
        "cnpj": "11102088000179",
        "qtd_animais": 700,
        "horario_funcionamento": "Sem horário fixo",
        "descricao": "ONG que cuida e protege animais em situação de vulnerabilidade em Anápolis.",
        "necessidades": ["Ração", "Medicamentos", "Materiais de limpeza", "Recursos para tratamentos veterinários"],
        "aceita_voluntarios": True,
        "endereco": "D A I A - BR153 - Distrito Agroindustrial de Anápolis, Anápolis - GO, 75104-240",
        "redes_sociais": {
            Plataforma.instagram: "https://www.instagram.com/aspaananapolis/",
            Plataforma.email: "contato@aspaananapolis.com.br",
            Plataforma.facebook: "https://www.facebook.com/aspaan.com.br/",
        },
        "aceita_doacoes": True,
    },
    {
        "slug": "parceira3",
        "nome_usuario": "Instituição Parceira 3",
        "nome": "Instituição Parceira 3",
        "cidade": "Anápolis",
        "uf": "GO",
        "qtd_animais": 200,
        "horario_funcionamento": "Segunda a sexta, 8h–17h",
        "descricao": "Associação dedicada ao resgate e adoção responsável de animais.",
        "necessidades": ["Ração", "Medicamentos", "Materiais de limpeza", "Apoio para tratamentos veterinários"],
        "aceita_voluntarios": True,
        "endereco": "Anápolis - GO",
        "aceita_doacoes": True,
    },
    {
        "slug": "parceira4",
        "nome_usuario": "Instituição Parceira 4",
        "nome": "Instituição Parceira 4",
        "cidade": "Anápolis",
        "uf": "GO",
        "qtd_animais": 150,
        "horario_funcionamento": "Todos os dias, 7h–18h",
        "descricao": "Grupo voluntário focado em resgates emergenciais e cuidados veterinários.",
        "necessidades": ["Medicamentos", "Ração", "Materiais de primeiros socorros", "Recursos para atendimentos veterinários"],
        "aceita_voluntarios": True,
        "endereco": "Anápolis - GO",
        "aceita_doacoes": True,
    },
    {
        "slug": "parceira5",
        "nome_usuario": "Instituição Parceira 5",
        "nome": "Instituição Parceira 5",
        "cidade": "Goiânia",
        "uf": "GO",
        "qtd_animais": 80,
        "horario_funcionamento": "Fins de semana",
        "descricao": "Grupo independente que promove adoções e campanhas de castração.",
        "necessidades": ["Ração", "Medicamentos", "Materiais para campanhas", "Apoio para castrações"],
        "aceita_voluntarios": True,
        "endereco": "Goiânia - GO",
        "aceita_doacoes": True,
    },
    {
        "slug": "parceira6",
        "nome_usuario": "Instituição Parceira 6",
        "nome": "Instituição Parceira 6",
        "cidade": "Goiânia",
        "uf": "GO",
        "qtd_animais": 300,
        "horario_funcionamento": "Segunda a sexta, 9h–16h",
        "descricao": "Organização sem fins lucrativos que oferece abrigo e cuidados para animais abandonados.",
        "necessidades": ["Ração", "Medicamentos", "Materiais de limpeza", "Manutenção do abrigo"],
        "aceita_voluntarios": True,
        "endereco": "Goiânia - GO",
        "aceita_doacoes": True,
    },
    {
        "slug": "parceira7",
        "nome_usuario": "Instituição Parceira 7",
        "nome": "Instituição Parceira 7",
        "cidade": "Goiânia",
        "uf": "GO",
        "qtd_animais": 120,
        "horario_funcionamento": "Segunda a sexta, 10h–15h",
        "descricao": "Centro de resgate e reabilitação de animais silvestres e domésticos.",
        "necessidades": ["Medicamentos", "Alimentação especializada", "Materiais veterinários", "Recursos para reabilitação"],
        "aceita_voluntarios": False,
        "endereco": "Goiânia - GO",
        "aceita_doacoes": True,
    },
    {
        "slug": "parceira8",
        "nome_usuario": "Instituição Parceira 8",
        "nome": "Instituição Parceira 8",
        "cidade": "Anápolis",
        "uf": "GO",
        "qtd_animais": 250,
        "horario_funcionamento": "Todos os dias, 8h–20h",
        "descricao": "ONG que promove educação sobre cuidados com animais e adoção responsável.",
        "necessidades": ["Ração", "Materiais educativos", "Medicamentos", "Recursos para ações de adoção"],
        "aceita_voluntarios": True,
        "endereco": "Anápolis - GO",
        "aceita_doacoes": True,
    },
    {
        "slug": "parceira9",
        "nome_usuario": "Instituição Parceira 9",
        "nome": "Instituição Parceira 9",
        "cidade": "Goiânia",
        "uf": "GO",
        "qtd_animais": 400,
        "horario_funcionamento": "Segunda a sexta, 7h–17h",
        "descricao": "Associação que oferece abrigo temporário e cuidados veterinários para animais em situação de risco.",
        "necessidades": ["Ração", "Medicamentos", "Materiais de limpeza", "Recursos para tratamentos veterinários"],
        "aceita_voluntarios": False,
        "endereco": "Goiânia - GO",
        "aceita_doacoes": True,
    },
]


def _montar_usuario(dados: dict[str, Any], senha_hash: str) -> Usuario:
    dados = dict(dados)
    slug = dados.pop("slug")
    nome_usuario = dados.pop("nome_usuario")
    redes = dados.pop("redes_sociais", {})
    necessidades = dados.pop("necessidades", [])

    instituicao = Instituicao(
        **dados,
        redes_sociais=[RedeSocial(plataforma=p, contato=c) for p, c in redes.items()],
        necessidades=[Necessidade(nome_item=n, prioridade=Prioridade.media) for n in necessidades],
    )
    return Usuario(
        nome=nome_usuario,
        email=f"{slug}@{EMAIL_DOMINIO}",
        senha=senha_hash,
        tipo_usuario=TipoUsuario.instituicao,
        instituicao=instituicao,
    )


def main() -> None:
    if settings.is_production:
        print("Seed bloqueado: APP_ENV=production.")
        return

    senha = settings.SEED_PASSWORD or getpass.getpass("Senha dos usuários do seed: ").strip()
    if len(senha) < 8:
        print("A senha precisa ter pelo menos 8 caracteres.")
        return
    senha_hash = hash_password(senha)

    criadas, ignoradas = 0, 0
    with SessionLocal() as db:
        for dados in INSTITUICOES:
            email = f"{dados['slug']}@{EMAIL_DOMINIO}"
            if db.scalar(select(Usuario.id_usuario).where(Usuario.email == email)):
                ignoradas += 1
                continue
            db.add(_montar_usuario(dados, senha_hash))
            criadas += 1
        db.commit()

    print(f"Instituições criadas: {criadas} | já existentes: {ignoradas}")
    print(f"Login: <slug>@{EMAIL_DOMINIO} (ex.: aspaan@{EMAIL_DOMINIO}) com a senha do seed.")


if __name__ == "__main__":
    main()
