from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.core.config import settings
from app.core.security import JWT_ALGORITHM

API = "/api/v1"


def cadastrar_e_logar(client, prefixo: str, tipo_usuario: str) -> str:
    email = f"{tipo_usuario}@npet.org"
    client.post(f"{API}/{prefixo}/auth/register", json={
        "nome": "Teste", "email": email, "senha": "senha1234", "tipo_usuario": tipo_usuario,
    })
    resposta = client.post(f"{API}/{prefixo}/auth/login", json={"email": email, "senha": "senha1234"})
    assert resposta.status_code == 200
    assert resposta.json()["token_type"] == "bearer"
    return resposta.json()["access_token"]


def gerar_token(sub: str, minutos: int) -> str:
    expira_em = datetime.now(timezone.utc) + timedelta(minutes=minutos)
    return jwt.encode({"sub": sub, "exp": expira_em}, settings.JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def test_sem_token_retorna_401(client):
    assert client.get(f"{API}/instituicoes").status_code == 401


@pytest.mark.parametrize("token", [
    "token-qualquer",
    jwt.encode({"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)}, "outra-chave", algorithm=JWT_ALGORITHM),
])
def test_token_invalido_retorna_401(client, token):
    resposta = client.get(f"{API}/instituicoes", headers={"Authorization": f"Bearer {token}"})
    assert resposta.status_code == 401


def test_token_expirado_retorna_401(client):
    cadastrar_e_logar(client, "users", "doador")
    token = gerar_token("1", minutos=-1)
    resposta = client.get(f"{API}/instituicoes", headers={"Authorization": f"Bearer {token}"})
    assert resposta.status_code == 401


def test_token_de_usuario_inexistente_retorna_401(client):
    token = gerar_token("999", minutos=5)
    resposta = client.get(f"{API}/instituicoes", headers={"Authorization": f"Bearer {token}"})
    assert resposta.status_code == 401


def test_login_com_senha_errada_retorna_401(client):
    cadastrar_e_logar(client, "users", "doador")
    resposta = client.post(f"{API}/users/auth/login", json={"email": "doador@npet.org", "senha": "errada123"})
    assert resposta.status_code == 401


@pytest.mark.parametrize("prefixo, tipo_usuario", [("users", "doador"), ("institutions", "instituicao")])
def test_token_valido_acessa_rotas_protegidas(client, prefixo, tipo_usuario):
    headers = {"Authorization": f"Bearer {cadastrar_e_logar(client, prefixo, tipo_usuario)}"}

    lista = client.get(f"{API}/instituicoes", headers=headers)
    assert lista.status_code == 200
    assert len(lista.json()) > 0

    assert client.get(f"{API}/instituicoes/1", headers=headers).status_code == 200


@pytest.mark.parametrize("tipo_usuario", ["doador", "instituicao"])
def test_login_por_formulario_oauth2(client, tipo_usuario):
    prefixo = "users" if tipo_usuario == "doador" else "institutions"
    cadastrar_e_logar(client, prefixo, tipo_usuario)

    resposta = client.post(f"{API}/users/auth/token", data={"username": f"{tipo_usuario}@npet.org", "password": "senha1234"})
    assert resposta.status_code == 200

    headers = {"Authorization": f"Bearer {resposta.json()['access_token']}"}
    assert client.get(f"{API}/instituicoes", headers=headers).status_code == 200
