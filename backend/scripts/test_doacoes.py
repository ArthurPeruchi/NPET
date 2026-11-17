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


@pytest.fixture(autouse=True)
def sem_espera_no_retry(monkeypatch):
    """O retry do cliente do MP espera entre tentativas; nos testes a espera é nula."""
    import app.integrations.mercadopago as mp

    esperas: list[float] = []
    monkeypatch.setattr(mp, "_esperar", esperas.append)
    return esperas


@pytest.fixture
def emails(monkeypatch) -> list[tuple[str, str, str]]:
    """Troca o envio real de e-mail (agendado pela rota) por uma lista."""
    import app.modules.doacoes.router as rotas

    enviados: list[tuple[str, str, str]] = []
    monkeypatch.setattr(rotas, "send_email", lambda *args: enviados.append(args))
    return enviados


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


# ---------- aprovação automática do PIX no sandbox (MP_PIX_TEST_APPROVAL) ----------

def _payer_enviado(monkeypatch, forma: str) -> dict:
    import httpx
    from decimal import Decimal
    from app.integrations.mercadopago import MercadoPagoGateway

    chamadas = _respostas_em_sequencia(monkeypatch, httpx.Response(201, json={"id": 1, "status": "pending"}))
    gateway_real = MercadoPagoGateway(access_token="TEST-1")
    comum = {"id_doacao": 1, "valor": Decimal("10.00"), "descricao": "x", "email_pagador": "d@npet.org"}
    if forma == "pix":
        gateway_real.create_pix_payment(**comum)
    else:
        gateway_real.create_card_payment(**comum, card_token="tok", payment_method_id="visa")
    assert len(chamadas) == 1
    return chamadas[0]["json"]["payer"]


def test_pix_sem_a_flag_envia_so_o_email(monkeypatch):
    monkeypatch.setattr(settings, "MP_PIX_TEST_APPROVAL", False)
    assert _payer_enviado(monkeypatch, "pix") == {"email": "d@npet.org"}


def test_pix_com_a_flag_em_desenvolvimento_envia_apro(monkeypatch):
    monkeypatch.setattr(settings, "MP_PIX_TEST_APPROVAL", True)
    monkeypatch.setattr(settings, "APP_ENV", "development")
    assert _payer_enviado(monkeypatch, "pix") == {"email": "d@npet.org", "first_name": "APRO"}


def test_flag_e_ignorada_em_producao(monkeypatch):
    monkeypatch.setattr(settings, "MP_PIX_TEST_APPROVAL", True)
    monkeypatch.setattr(settings, "APP_ENV", "production")
    assert _payer_enviado(monkeypatch, "pix") == {"email": "d@npet.org"}


def test_flag_nao_afeta_o_cartao(monkeypatch):
    monkeypatch.setattr(settings, "MP_PIX_TEST_APPROVAL", True)
    monkeypatch.setattr(settings, "APP_ENV", "development")
    assert _payer_enviado(monkeypatch, "cartao") == {"email": "d@npet.org"}


# ---------- data da confirmação e aviso ao doador (RNE-003 / RNE-013) ----------

def test_pix_pendente_nao_tem_data_de_confirmacao_nem_email(client, gateway, instituicao, doador, emails):
    corpo = doar(client, doador, instituicao).json()

    assert corpo["status"] == "pendente"
    assert "confirmadaEm" not in corpo
    assert emails == []


def test_cartao_aprovado_registra_a_data_e_avisa_o_doador(client, gateway, instituicao, doador, emails):
    antes = datetime.now(timezone.utc)
    corpo = doar(client, doador, instituicao, **CARTAO).json()

    confirmada_em = datetime.fromisoformat(corpo["confirmadaEm"])
    if confirmada_em.tzinfo is None:
        confirmada_em = confirmada_em.replace(tzinfo=timezone.utc)
    assert confirmada_em >= antes - timedelta(seconds=1)

    assert len(emails) == 1
    destinatario, assunto, texto = emails[0]
    assert destinatario == "doador@npet.org"
    assert assunto == "Sua doação foi confirmada"
    assert "ASPAAN" in texto and "R$ 50,00" in texto and "cartão de crédito" in texto


def test_cartao_recusado_nao_registra_data_nem_avisa(client, gateway, instituicao, doador, emails):
    gateway.status_cartao = ("rejected", "cc_rejected_other_reason")
    assert doar(client, doador, instituicao, **CARTAO).status_code == 402
    assert emails == []


def test_webhook_confirma_uma_vez_so_mesmo_repetido(
    client, gateway, instituicao, doador, emails, segredo_webhook
):
    id_doacao = doar(client, doador, instituicao).json()["id"]
    gateway.aprovar("1001")

    def notificar():
        resposta = client.post(
            f"{API}/pagamentos/webhook?data.id=1001&type=payment",
            json={"type": "payment", "data": {"id": "1001"}},
            headers=assinar("1001"),
        )
        assert resposta.status_code == 200
        return client.get(f"{API}/doacoes/{id_doacao}", headers=doador).json()

    primeira = notificar()
    segunda = notificar()  # o MP reenvia notificações; nada pode mudar

    assert primeira["status"] == "confirmada" and primeira["confirmadaEm"]
    assert segunda["confirmadaEm"] == primeira["confirmadaEm"]
    assert len(emails) == 1
    assert "PIX" in emails[0][2]


def test_sincronizacao_do_detalhe_tambem_registra_e_avisa(client, gateway, instituicao, doador, emails):
    id_doacao = doar(client, doador, instituicao).json()["id"]
    gateway.aprovar("1001")

    corpo = client.get(f"{API}/doacoes/{id_doacao}", headers=doador).json()

    assert corpo["status"] == "confirmada" and corpo["confirmadaEm"]
    assert len(emails) == 1
    historico = client.get(f"{API}/doacoes/me", headers=doador).json()
    assert historico[0]["confirmadaEm"] == corpo["confirmadaEm"]


def test_falha_no_envio_do_email_nao_quebra_o_webhook(
    client, gateway, instituicao, doador, segredo_webhook, monkeypatch
):
    import smtplib

    from app.core import email as modulo_email

    # Usa o send_email real com um SMTP que falha: ele registra o erro e não propaga.
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.invalido.local")

    def smtp_quebrado(*args, **kwargs):
        raise smtplib.SMTPConnectError(421, "fora do ar")

    monkeypatch.setattr(modulo_email.smtplib, "SMTP", smtp_quebrado)

    id_doacao = doar(client, doador, instituicao).json()["id"]
    gateway.aprovar("1001")
    resposta = client.post(
        f"{API}/pagamentos/webhook?data.id=1001&type=payment",
        json={"type": "payment", "data": {"id": "1001"}},
        headers=assinar("1001"),
    )

    assert resposta.status_code == 200
    gateway.falhar = True
    assert client.get(f"{API}/doacoes/{id_doacao}", headers=doador).json()["status"] == "confirmada"


# ---------- timeout e retry configuráveis (RNF-012) ----------

def _respostas_em_sequencia(monkeypatch, *itens):
    """Faz o httpx.request devolver (ou levantar) cada item, em ordem; guarda as chamadas."""
    import httpx

    fila = list(itens)
    chamadas: list[dict] = []

    def falso_request(metodo, url, headers, timeout, **kwargs):
        chamadas.append({"metodo": metodo, "headers": headers, "timeout": timeout, "json": kwargs.get("json")})
        item = fila.pop(0)
        if isinstance(item, Exception):
            raise item
        return item

    monkeypatch.setattr(httpx, "request", falso_request)
    return chamadas


def test_cliente_mp_repete_timeout_e_5xx_ate_conseguir(monkeypatch, sem_espera_no_retry):
    import httpx
    from decimal import Decimal
    from app.integrations.mercadopago import MercadoPagoGateway

    monkeypatch.setattr(settings, "MP_MAX_RETRIES", 2)
    monkeypatch.setattr(settings, "MP_RETRY_BACKOFF_SECONDS", 0.5)
    chamadas = _respostas_em_sequencia(
        monkeypatch,
        httpx.ReadTimeout("demorou"),
        httpx.Response(503, json={}),
        httpx.Response(201, json={"id": 9, "status": "pending"}),
    )

    pagamento = MercadoPagoGateway(access_token="TEST-1").create_pix_payment(
        id_doacao=7, valor=Decimal("10.00"), descricao="x", email_pagador="d@npet.org",
    )

    assert pagamento.id == "9"
    assert len(chamadas) == 3
    # Todas as tentativas usam a mesma chave: o MP não cobra em dobro.
    assert {c["headers"]["X-Idempotency-Key"] for c in chamadas} == {"npet-doacao-7"}
    assert sem_espera_no_retry == [0.5, 1.0]  # espera exponencial


def test_cliente_mp_usa_o_timeout_configurado(monkeypatch):
    import httpx
    from app.integrations.mercadopago import MercadoPagoGateway

    monkeypatch.setattr(settings, "MP_TIMEOUT_SECONDS", 7.0)
    monkeypatch.setattr(settings, "MP_CONNECT_TIMEOUT_SECONDS", 2.0)
    chamadas = _respostas_em_sequencia(monkeypatch, httpx.Response(200, json={"id": 1, "status": "approved"}))

    MercadoPagoGateway(access_token="TEST-1").get_payment("1")

    assert chamadas[0]["timeout"] == httpx.Timeout(7.0, connect=2.0)


def test_cliente_mp_nao_repete_erro_400(monkeypatch):
    import httpx
    from app.core.exceptions import UnprocessableError
    from app.integrations.mercadopago import MercadoPagoGateway

    monkeypatch.setattr(settings, "MP_MAX_RETRIES", 3)
    chamadas = _respostas_em_sequencia(monkeypatch, httpx.Response(400, json={"message": "token usado"}))

    with pytest.raises(UnprocessableError):
        MercadoPagoGateway(access_token="TEST-1").get_payment("1")
    assert len(chamadas) == 1


def test_cliente_mp_desiste_apos_as_tentativas(monkeypatch):
    import httpx
    from app.integrations.mercadopago import MercadoPagoGateway

    monkeypatch.setattr(settings, "MP_MAX_RETRIES", 1)
    chamadas = _respostas_em_sequencia(
        monkeypatch, httpx.ConnectError("sem rede"), httpx.ConnectError("sem rede")
    )

    with pytest.raises(PaymentGatewayError):
        MercadoPagoGateway(access_token="TEST-1").get_payment("1")
    assert len(chamadas) == 2


def test_mp_fora_do_ar_apos_retries_cancela_a_doacao_sem_perder_o_registro(
    client, instituicao, doador, monkeypatch
):
    """Ponta a ponta com o cliente real: as tentativas se esgotam, a rota responde 502 e a
    doação continua no histórico como cancelada (RNF-012: sem perda de dados)."""
    import httpx

    monkeypatch.setattr(settings, "MP_ACCESS_TOKEN", "TEST-1")
    monkeypatch.setattr(settings, "MP_MAX_RETRIES", 2)
    chamadas = _respostas_em_sequencia(monkeypatch, *[httpx.Response(500, json={})] * 3)

    resposta = doar(client, doador, instituicao)

    assert resposta.status_code == 502
    assert len(chamadas) == 3
    historico = client.get(f"{API}/doacoes/me", headers=doador).json()
    assert [d["status"] for d in historico] == ["cancelada"]
