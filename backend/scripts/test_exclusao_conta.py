"""Exclusão de conta: anonimização de quem tem doações e bloqueio da instituição com doações."""

from sqlalchemy import update

from app.database.models import Doacao, Instituicao, TipoUsuario, Usuario
from scripts.test_doacoes import (  # noqa: F401 (fixtures reaproveitadas)
    API,
    CARTAO,
    SENHA,
    assinar,
    cadastrar,
    doador,
    doar,
    emails,
    gateway,
    instituicao,
    segredo_webhook,
)


def excluir_me(client, headers, senha=SENHA):
    return client.post(f"{API}/users/me/delete", json={"senha": senha}, headers=headers)


def login(client, email, senha=SENHA):
    return client.post(f"{API}/auth/login", json={"email": email, "senha": senha})


def cadastrar_login(client, email) -> dict:
    """Headers de quem já está cadastrado (ex.: a instituição criada pela fixture)."""
    return {"Authorization": f"Bearer {login(client, email).json()['access_token']}"}


def usuario_por_id(session_factory, id_usuario) -> Usuario | None:
    with session_factory() as db:
        return db.get(Usuario, id_usuario)


def id_do_usuario(client, headers) -> int:
    return client.get(f"{API}/users/me", headers=headers).json()["id_usuario"]


def admin(client, session_factory) -> dict:
    headers = cadastrar(client, "doador", "admin@npet.org")
    with session_factory() as db:
        db.execute(
            update(Usuario)
            .where(Usuario.email == "admin@npet.org")
            .values(tipo_usuario=TipoUsuario.administrador)
        )
        db.commit()
    return headers


# ---------- doador ----------

def test_doador_sem_doacoes_e_apagado_de_vez(client, session_factory, doador):
    id_usuario = id_do_usuario(client, doador)

    assert excluir_me(client, doador).status_code == 204
    assert usuario_por_id(session_factory, id_usuario) is None


def test_doador_com_doacoes_e_anonimizado_e_o_historico_fica(
    client, session_factory, gateway, instituicao, doador
):
    id_usuario = id_do_usuario(client, doador)
    id_doacao = doar(client, doador, instituicao, recorrente=True, **CARTAO).json()["id"]

    resposta = excluir_me(client, doador)
    assert resposta.status_code == 204
    assert 'access_token=""' in resposta.headers.get("set-cookie", "")  # sessão encerrada

    usuario = usuario_por_id(session_factory, id_usuario)
    assert usuario.nome == "Usuário removido"
    assert usuario.email == f"removido-{id_usuario}@usuario-removido.npet.com.br"
    assert (usuario.senha, usuario.cpf, usuario.telefone, usuario.ativo) == (None, None, None, False)
    assert usuario.anonimizado_em is not None

    with session_factory() as db:
        doacao = db.get(Doacao, id_doacao)
        assert doacao.id_usuario == id_usuario
        assert doacao.status.value == "confirmada"
        assert doacao.dinheiro.recorrente is False  # sem lembrete para conta excluída

    assert login(client, "doador@npet.org").status_code == 401


def test_email_de_conta_anonimizada_pode_ser_cadastrado_de_novo(client, gateway, instituicao, doador):
    doar(client, doador, instituicao, **CARTAO)
    assert excluir_me(client, doador).status_code == 204

    cadastrar(client, "doador", "doador@npet.org")  # o helper já confere o 201 e o login


def test_senha_errada_nao_exclui_nem_anonimiza(client, session_factory, gateway, instituicao, doador):
    id_usuario = id_do_usuario(client, doador)
    doar(client, doador, instituicao)

    assert excluir_me(client, doador, senha="Errada123").status_code == 400
    assert usuario_por_id(session_factory, id_usuario).anonimizado_em is None


def test_pix_pago_depois_da_exclusao_confirma_sem_enviar_email(
    client, session_factory, gateway, instituicao, doador, emails, segredo_webhook
):
    id_doacao = doar(client, doador, instituicao).json()["id"]
    assert excluir_me(client, doador).status_code == 204

    gateway.aprovar("1001")
    resposta = client.post(
        f"{API}/pagamentos/webhook?data.id=1001&type=payment",
        json={"type": "payment", "data": {"id": "1001"}},
        headers=assinar("1001"),
    )

    assert resposta.status_code == 200
    with session_factory() as db:
        doacao = db.get(Doacao, id_doacao)
        assert doacao.status.value == "confirmada" and doacao.confirmada_em is not None
    assert emails == []


# ---------- instituição ----------

def test_instituicao_com_doacoes_recebidas_nao_pode_ser_excluida(
    client, session_factory, gateway, instituicao, doador
):
    doar(client, doador, instituicao)
    ong = cadastrar_login(client, "ong@npet.org")

    resposta = excluir_me(client, ong)
    assert resposta.status_code == 409
    assert "desativação" in resposta.json()["detail"]

    # Nem pela rota da própria instituição.
    assert client.delete(f"{API}/instituicoes/{instituicao}", headers=ong).status_code == 409
    with session_factory() as db:
        assert db.get(Instituicao, instituicao) is not None


def test_instituicao_sem_doacoes_sai_junto_com_a_conta(client, session_factory, instituicao):
    ong = cadastrar_login(client, "ong@npet.org")
    id_usuario = id_do_usuario(client, ong)

    assert excluir_me(client, ong).status_code == 204
    assert usuario_por_id(session_factory, id_usuario) is None
    with session_factory() as db:
        assert db.get(Instituicao, instituicao) is None


# ---------- admin ----------

def test_admin_exclui_doador_com_doacoes_anonimizando_sem_senha(
    client, session_factory, gateway, instituicao, doador
):
    id_usuario = id_do_usuario(client, doador)
    doar(client, doador, instituicao)
    headers_admin = admin(client, session_factory)

    assert client.delete(f"{API}/users/{id_usuario}", headers=headers_admin).status_code == 204
    assert usuario_por_id(session_factory, id_usuario).anonimizado_em is not None


def test_admin_exclui_instituicao_com_doacoes_recebe_409(
    client, session_factory, gateway, instituicao, doador
):
    doar(client, doador, instituicao)
    with session_factory() as db:
        id_usuario_ong = db.get(Instituicao, instituicao).id_usuario
    headers_admin = admin(client, session_factory)

    assert client.delete(f"{API}/users/{id_usuario_ong}", headers=headers_admin).status_code == 409


def test_conta_anonimizada_nao_pode_ser_reativada(client, session_factory, gateway, instituicao, doador):
    id_usuario = id_do_usuario(client, doador)
    doar(client, doador, instituicao)
    excluir_me(client, doador)
    headers_admin = admin(client, session_factory)

    resposta = client.post(f"{API}/users/{id_usuario}/reactivate", headers=headers_admin)
    assert resposta.status_code == 409
    assert usuario_por_id(session_factory, id_usuario).ativo is False
