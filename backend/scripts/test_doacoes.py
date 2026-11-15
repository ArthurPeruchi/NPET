import hashlib
import hmac
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import update

from app.core.config import settings
from app.core.exceptions import PaymentGatewayError
from app.database.models import Instituicao, Usuario
from app.integrations.mercadopago import PagamentoMP, assinatura_webhook_valida, get_payment_gateway
from app.main import app

API = "/api/v1"
SENHA = "Senha1234"
SEGREDO = "segredo-do-webhook"


class GatewayFalso:
    """Substitui o Mercado Pago nos testes; guarda as chamadas e devolve respostas programadas."""

    def __init__(self) -> None:
        self.status_cartao = ("approved", "accredited")
        self.falhar = False
        self.pagamentos: dict[str, PagamentoMP] = {}
        self.chamadas: list[dict] = []
        self._proximo_id = 1000

    def _novo(self, **kwargs) -> PagamentoMP:
        if self.falhar:
            raise PaymentGatewayError("Mercado Pago fora do ar.")
        self._proximo_id += 1
        pagamento = PagamentoMP(id=str(self._proximo_id), **kwargs)
        self.pagamentos[pagamento.id] = pagamento
        return pagamento

    def create_pix_payment(self, **kwargs) -> PagamentoMP:
        self.chamadas.append({"tipo": "pix", **kwargs})
        return self._novo(
            status="pending", status_detail="pending_waiting_transfer",
            external_reference=str(kwargs["id_doacao"]), pix_qr_code="00020126PIXCOPIAECOLA",
            pix_expira_em=datetime.now(timezone.utc) + timedelta(minutes=30),
        )

    def create_card_payment(self, **kwargs) -> PagamentoMP:
        self.chamadas.append({"tipo": "cartao", **kwargs})
        status, detalhe = self.status_cartao
        return self._novo(
            status=status, status_detail=detalhe,
            external_reference=str(kwargs["id_doacao"]), cartao_final="3704",
        )

    def get_payment(self, payment_id: str) -> PagamentoMP:
        if self.falhar:
            raise PaymentGatewayError("Mercado Pago fora do ar.")
        return self.pagamentos[payment_id]

    def aprovar(self, payment_id: str) -> None:
        self.pagamentos[payment_id].status = "approved"
        self.pagamentos[payment_id].status_detail = "accredited"


@pytest.fixture
def gateway(client):
    falso = GatewayFalso()
    app.dependency_overrides[get_payment_gateway] = lambda: falso
    return falso


def cadastrar(client, tipo_usuario: str, email: str) -> dict:
    if tipo_usuario == "instituicao":
        corpo = {"nome": "ASPAAN", "email": email, "senha": SENHA, "cidade": "Anápolis", "uf": "GO"}
        assert client.post(f"{API}/institutions/auth/register", json=corpo).status_code == 201
    else:
        corpo = {"nome": "Teste", "email": email, "senha": SENHA, "tipo_usuario": tipo_usuario}
        assert client.post(f"{API}/auth/register", json=corpo).status_code == 201
    resposta = client.post(f"{API}/auth/login", json={"email": email, "senha": SENHA})
    assert resposta.status_code == 200
    return {"Authorization": f"Bearer {resposta.json()['access_token']}"}


@pytest.fixture
def instituicao(client, session_factory) -> int:
    cadastrar(client, "instituicao", "ong@npet.org")
    with session_factory() as db:
        return db.query(Instituicao).one().id_instituicao


@pytest.fixture
def doador(client) -> dict:
    return cadastrar(client, "doador", "doador@npet.org")


def doar(client, headers, id_instituicao, **extra):
    corpo = {"idInstituicao": id_instituicao, "valor": 50, "formaPagamento": "pix", "recorrente": False, **extra}
    return client.post(f"{API}/doacoes/monetarias", json=corpo, headers=headers)


CARTAO = {"formaPagamento": "cartao_credito", "cardToken": "tok_teste", "paymentMethodId": "visa"}


# ---------- criação ----------

def test_pix_cria_doacao_pendente_com_qr_code(client, gateway, instituicao, doador):
    resposta = doar(client, doador, instituicao, valor=25.5, recorrente=True)

    assert resposta.status_code == 201
    corpo = resposta.json()
    assert corpo["status"] == "pendente"
    assert corpo["tipoDoacao"] == "monetaria"
    assert corpo["valor"] == 25.5
    assert corpo["formaPagamento"] == "pix"
    assert corpo["recorrente"] is True
    assert corpo["feedbackVisto"] is False
    assert corpo["pix"]["qrCode"] == "00020126PIXCOPIAECOLA"
    assert gateway.chamadas[0]["email_pagador"] == "doador@npet.org"
    assert gateway.chamadas[0]["id_doacao"] == corpo["id"]


def test_cartao_aprovado_confirma_e_guarda_so_o_final(client, gateway, instituicao, doador):
    resposta = doar(client, doador, instituicao, **CARTAO)

    assert resposta.status_code == 201
    corpo = resposta.json()
    assert corpo["status"] == "confirmada"
    assert corpo["cartaoFinal"] == "3704"
    assert "pix" not in corpo
    assert gateway.chamadas[0]["card_token"] == "tok_teste"


def test_cartao_recusado_retorna_402_e_fica_cancelada(client, gateway, instituicao, doador):
    gateway.status_cartao = ("rejected", "cc_rejected_insufficient_amount")

    resposta = doar(client, doador, instituicao, **CARTAO)
    assert resposta.status_code == 402
    assert resposta.json()["detail"] == "Saldo ou limite insuficiente."

    historico = client.get(f"{API}/doacoes/me", headers=doador).json()
    assert [d["status"] for d in historico] == ["cancelada"]


def test_falha_do_mercado_pago_retorna_502_e_cancela(client, gateway, instituicao, doador):
    gateway.falhar = True

    assert doar(client, doador, instituicao).status_code == 502
    assert client.get(f"{API}/doacoes/me", headers=doador).json()[0]["status"] == "cancelada"


@pytest.mark.parametrize("extra", [
    {"valor": 0.5},
    {"valor": 10000.01},
    {"valor": 10.123},
    {"formaPagamento": "cartao_credito"},                    # cartão sem token
    {"cardToken": "tok_teste", "paymentMethodId": "visa"},   # PIX com dados de cartão
])
def test_corpo_invalido_retorna_422(client, gateway, instituicao, doador, extra):
    assert doar(client, doador, instituicao, **extra).status_code == 422
    assert gateway.chamadas == []


def test_instituicao_que_nao_aceita_doacoes_retorna_422(client, gateway, session_factory, instituicao, doador):
    with session_factory() as db:
        db.execute(update(Instituicao).values(aceita_doacoes=False))
        db.commit()
    assert doar(client, doador, instituicao).status_code == 422


def test_instituicao_desativada_ou_inexistente_retorna_404(client, gateway, session_factory, instituicao, doador):
    assert doar(client, doador, 999).status_code == 404

    with session_factory() as db:
        db.execute(update(Usuario).where(Usuario.email == "ong@npet.org").values(ativo=False))
        db.commit()
    assert doar(client, doador, instituicao).status_code == 404


def test_somente_doador_pode_doar(client, gateway, instituicao):
    resposta = client.post(f"{API}/auth/login", json={"email": "ong@npet.org", "senha": SENHA})
    headers_instituicao = {"Authorization": f"Bearer {resposta.json()['access_token']}"}

    assert doar(client, headers_instituicao, instituicao).status_code == 403

    client.cookies.clear()  # o login também grava o token em cookie
    assert doar(client, {}, instituicao).status_code == 401


# ---------- histórico e detalhe ----------

def test_historico_mostra_so_as_doacoes_do_usuario(client, gateway, instituicao, doador):
    doar(client, doador, instituicao)
    doar(client, doador, instituicao, **CARTAO)
    outro = cadastrar(client, "doador", "outro@npet.org")
    doar(client, outro, instituicao)

    meus = client.get(f"{API}/doacoes/me", headers=doador).json()
    assert len(meus) == 2
    assert meus[0]["id"] > meus[1]["id"]  # mais recentes primeiro
    assert len(client.get(f"{API}/doacoes/me", headers=outro).json()) == 1


def test_detalhe_de_doacao_de_outro_usuario_retorna_404(client, gateway, instituicao, doador):
    id_doacao = doar(client, doador, instituicao).json()["id"]
    outro = cadastrar(client, "doador", "outro@npet.org")

    assert client.get(f"{API}/doacoes/{id_doacao}", headers=outro).status_code == 404
    assert client.get(f"{API}/doacoes/{id_doacao}", headers=doador).status_code == 200


def test_detalhe_de_pix_pendente_sincroniza_com_o_mercado_pago(client, gateway, instituicao, doador):
    id_doacao = doar(client, doador, instituicao).json()["id"]
    gateway.aprovar("1001")

    corpo = client.get(f"{API}/doacoes/{id_doacao}", headers=doador).json()
    assert corpo["status"] == "confirmada"
    assert "pix" not in corpo  # QR Code some depois de pago


def test_detalhe_com_mercado_pago_fora_do_ar_devolve_ultimo_estado(client, gateway, instituicao, doador):
    id_doacao = doar(client, doador, instituicao).json()["id"]
    gateway.falhar = True

    resposta = client.get(f"{API}/doacoes/{id_doacao}", headers=doador)
    assert resposta.status_code == 200
    assert resposta.json()["status"] == "pendente"


# ---------- recorrência e feedback ----------

def test_dono_altera_recorrencia_e_marca_feedback(client, gateway, instituicao, doador):
    id_doacao = doar(client, doador, instituicao, **CARTAO).json()["id"]

    resposta = client.patch(f"{API}/doacoes/{id_doacao}/recorrencia", json={"recorrente": True}, headers=doador)
    assert resposta.status_code == 200 and resposta.json()["recorrente"] is True

    resposta = client.patch(f"{API}/doacoes/{id_doacao}/feedback-visto", headers=doador)
    assert resposta.status_code == 200 and resposta.json()["feedbackVisto"] is True

    outro = cadastrar(client, "doador", "outro@npet.org")
    assert client.patch(f"{API}/doacoes/{id_doacao}/recorrencia", json={"recorrente": False}, headers=outro).status_code == 404


# ---------- webhook ----------

def assinar(data_id: str, request_id: str = "req-1", ts: str = "1731100000", segredo: str = SEGREDO) -> dict:
    manifesto = f"id:{data_id};request-id:{request_id};ts:{ts};"
    v1 = hmac.new(segredo.encode(), manifesto.encode(), hashlib.sha256).hexdigest()
    return {"x-signature": f"ts={ts},v1={v1}", "x-request-id": request_id}


@pytest.fixture
def segredo_webhook(monkeypatch):
    monkeypatch.setattr(settings, "MP_WEBHOOK_SECRET", SEGREDO)


def test_webhook_assinado_confirma_a_doacao(client, gateway, instituicao, doador, segredo_webhook):
    id_doacao = doar(client, doador, instituicao).json()["id"]
    gateway.aprovar("1001")

    resposta = client.post(
        f"{API}/pagamentos/webhook?data.id=1001&type=payment",
        json={"type": "payment", "data": {"id": "1001"}},
        headers=assinar("1001"),
    )
    assert resposta.status_code == 200

    gateway.falhar = True  # garante que o status veio do webhook, não da sincronização do GET
    assert client.get(f"{API}/doacoes/{id_doacao}", headers=doador).json()["status"] == "confirmada"


def test_webhook_com_assinatura_invalida_retorna_401(client, gateway, instituicao, doador, segredo_webhook):
    doar(client, doador, instituicao)
    gateway.aprovar("1001")

    resposta = client.post(
        f"{API}/pagamentos/webhook?data.id=1001&type=payment",
        json={"type": "payment", "data": {"id": "1001"}},
        headers=assinar("1001", segredo="segredo-errado"),
    )
    assert resposta.status_code == 401


def test_webhook_de_pagamento_desconhecido_retorna_200(client, gateway, segredo_webhook):
    gateway.pagamentos["555"] = PagamentoMP(id="555", status="approved", external_reference="999")

    resposta = client.post(f"{API}/pagamentos/webhook?data.id=555&type=payment", json={}, headers=assinar("555"))
    assert resposta.status_code == 200


def test_webhook_sem_segredo_configurado_retorna_503(client, gateway, monkeypatch):
    monkeypatch.setattr(settings, "MP_WEBHOOK_SECRET", None)
    resposta = client.post(f"{API}/pagamentos/webhook?data.id=1&type=payment", json={}, headers=assinar("1"))
    assert resposta.status_code == 503


def test_assinatura_sem_request_id_e_cabecalho_malformado():
    ts, data_id = "1731100000", "abc123"
    manifesto = f"id:{data_id};ts:{ts};"
    v1 = hmac.new(SEGREDO.encode(), manifesto.encode(), hashlib.sha256).hexdigest()

    assert assinatura_webhook_valida(f"ts={ts},v1={v1}", None, "ABC123", SEGREDO)
    assert not assinatura_webhook_valida("lixo", None, data_id, SEGREDO)
    assert not assinatura_webhook_valida(None, None, data_id, SEGREDO)


# ---------- cliente do Mercado Pago (HTTP simulado) ----------

def test_cliente_mp_monta_pagamento_pix_e_le_a_resposta(monkeypatch):
    import httpx
    from decimal import Decimal
    from app.integrations.mercadopago import MercadoPagoGateway

    enviado = {}

    def falso_request(metodo, url, headers, timeout, **kwargs):
        enviado.update(metodo=metodo, url=url, headers=headers, json=kwargs.get("json"))
        return httpx.Response(201, json={
            "id": 123, "status": "pending", "status_detail": "pending_waiting_transfer",
            "external_reference": "7", "date_of_expiration": "2026-11-08T22:30:00.000-03:00",
            "point_of_interaction": {"transaction_data": {"qr_code": "000201PIX"}},
        })

    monkeypatch.setattr(httpx, "request", falso_request)
    pagamento = MercadoPagoGateway(access_token="TEST-123").create_pix_payment(
        id_doacao=7, valor=Decimal("25.50"), descricao="Doação NPET para ASPAAN", email_pagador="d@npet.org",
    )

    assert enviado["metodo"] == "POST" and enviado["url"].endswith("/v1/payments")
    assert enviado["headers"]["Authorization"] == "Bearer TEST-123"
    assert enviado["headers"]["X-Idempotency-Key"] == "npet-doacao-7"
    assert enviado["json"]["payment_method_id"] == "pix"
    assert enviado["json"]["transaction_amount"] == 25.5
    assert enviado["json"]["external_reference"] == "7"
    assert (pagamento.id, pagamento.status, pagamento.pix_qr_code) == ("123", "pending", "000201PIX")
    assert pagamento.pix_expira_em.utcoffset() == timedelta(hours=-3)


@pytest.mark.parametrize("status_http, erro", [(400, 422), (500, 502)])
def test_cliente_mp_converte_erros_http(monkeypatch, status_http, erro):
    import httpx
    from app.core.exceptions import AppError
    from app.integrations.mercadopago import MercadoPagoGateway

    monkeypatch.setattr(httpx, "request", lambda *a, **k: httpx.Response(status_http, json={"message": "x"}))
    with pytest.raises(AppError) as exc:
        MercadoPagoGateway(access_token="TEST-123").get_payment("1")
    assert exc.value.status_code == erro


def test_cliente_mp_sem_credencial_retorna_502():
    from app.integrations.mercadopago import MercadoPagoGateway

    with pytest.raises(PaymentGatewayError):
        MercadoPagoGateway(access_token="").get_payment("1")
