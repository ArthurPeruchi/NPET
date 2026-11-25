import logging
from collections.abc import Callable, Sequence
from datetime import datetime, timedelta, timezone

from app.core.exceptions import (
    AppError,
    NotFoundError,
    PaymentRequiredError,
    UnprocessableError,
)
from app.database.models import (
    Doacao,
    DoacaoDinheiro,
    FormaPagamento,
    StatusDoacao,
    TipoDoacao,
    TipoUsuario,
    Usuario,
)
from app.integrations.mercadopago import MercadoPagoGateway, PagamentoMP
from app.modules.doacoes.repository import DoacaoRepository
from app.modules.doacoes.schemas import DoacaoMonetariaCreate
from app.modules.instituicoes.repository import InstituicaoRepository

logger = logging.getLogger(__name__)

# Status do Mercado Pago -> status da doação na NPET.
_STATUS_MP = {
    "approved": StatusDoacao.confirmada,
    "pending": StatusDoacao.pendente,
    "in_process": StatusDoacao.pendente,
    "authorized": StatusDoacao.pendente,
    "rejected": StatusDoacao.cancelada,
    "cancelled": StatusDoacao.cancelada,
    "refunded": StatusDoacao.cancelada,
    "charged_back": StatusDoacao.cancelada,
}

# Motivos de recusa do cartão (status_detail) mais comuns, em linguagem do doador.
_MOTIVOS_RECUSA = {
    "cc_rejected_insufficient_amount": "Saldo ou limite insuficiente.",
    "cc_rejected_bad_filled_card_number": "Número do cartão inválido. Confira e tente novamente.",
    "cc_rejected_bad_filled_date": "Data de validade inválida. Confira e tente novamente.",
    "cc_rejected_bad_filled_security_code": "Código de segurança inválido. Confira e tente novamente.",
    "cc_rejected_bad_filled_other": "Dados do cartão inválidos. Confira e tente novamente.",
    "cc_rejected_call_for_authorize": "Pagamento não autorizado. Entre em contato com o emissor do cartão.",
    "cc_rejected_card_disabled": "Cartão desativado. Entre em contato com o emissor do cartão.",
    "cc_rejected_duplicated_payment": "Pagamento duplicado: você já fez uma doação com esse valor agora há pouco.",
    "cc_rejected_high_risk": "Pagamento recusado por segurança. Tente outro cartão ou o PIX.",
    "cc_rejected_max_attempts": "Limite de tentativas atingido. Tente outro cartão ou o PIX.",
}
_MOTIVO_PADRAO = "Pagamento recusado pelo emissor do cartão. Tente outro cartão ou o PIX."


# Agenda o envio de um e-mail (destinatário, assunto, corpo); a rota usa BackgroundTasks.
AgendarEmail = Callable[[str, str, str], None]

_HORARIO_DE_BRASILIA = timezone(timedelta(hours=-3))  # sem horário de verão desde 2019

_NOME_FORMA = {FormaPagamento.pix: "PIX", FormaPagamento.cartao_credito: "cartão de crédito"}


def aplicar_pagamento(doacao: Doacao, pagamento: PagamentoMP) -> bool:
    """Copia o estado do pagamento do MP para a doação (idempotente).

    Devolve True só na primeira vez em que a doação passa a "confirmada": é aí que a data da
    confirmação é registrada e o doador deve ser avisado (RNE-013).
    """
    dinheiro = doacao.dinheiro
    dinheiro.mp_payment_id = pagamento.id
    dinheiro.mp_status = pagamento.status
    dinheiro.mp_status_detail = (pagamento.status_detail or "")[:60] or None
    if pagamento.pix_qr_code:
        dinheiro.pix_qr_code = pagamento.pix_qr_code
    if pagamento.pix_expira_em:
        dinheiro.pix_expira_em = pagamento.pix_expira_em
    if pagamento.cartao_final:
        dinheiro.cartao_final = pagamento.cartao_final
    doacao.status = _STATUS_MP.get(pagamento.status, StatusDoacao.pendente)

    if doacao.status == StatusDoacao.confirmada and doacao.confirmada_em is None:
        doacao.confirmada_em = datetime.now(timezone.utc)
        return True
    return False


def email_de_confirmacao(doacao: Doacao) -> tuple[str, str, str]:
    """Monta (destinatário, assunto, corpo) do aviso ao doador de que a doação foi confirmada."""
    dinheiro = doacao.dinheiro
    valor = f"R$ {dinheiro.valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    confirmada_em = doacao.confirmada_em
    if confirmada_em.tzinfo is None:  # SQLite devolve sem fuso; o valor gravado é UTC
        confirmada_em = confirmada_em.replace(tzinfo=timezone.utc)
    data = confirmada_em.astimezone(_HORARIO_DE_BRASILIA).strftime("%d/%m/%Y às %H:%M")
    forma = _NOME_FORMA.get(dinheiro.forma_pagamento, dinheiro.forma_pagamento.value)
    corpo = (
        f"Olá, {doacao.usuario.nome}!\n\n"
        f"Sua doação para {doacao.instituicao.nome} foi confirmada.\n\n"
        f"Valor: {valor}\n"
        f"Forma de pagamento: {forma}\n"
        f"Confirmada em: {data} (horário de Brasília)\n\n"
        "Você pode acompanhar suas contribuições no histórico de doações do NPET.\n"
        "Obrigado por apoiar a causa animal!\n\n"
        "Equipe NPET"
    )
    return doacao.usuario.email, "Sua doação foi confirmada", corpo


class DoacaoService:
    def __init__(
        self,
        repository: DoacaoRepository,
        instituicoes: InstituicaoRepository,
        gateway: MercadoPagoGateway,
        agendar_email: AgendarEmail | None = None,
    ) -> None:
        self._repository = repository
        self._instituicoes = instituicoes
        self._gateway = gateway
        self._agendar_email = agendar_email

    def _aplicar_e_salvar(self, doacao: Doacao, pagamento: PagamentoMP) -> Doacao:
        confirmou_agora = aplicar_pagamento(doacao, pagamento)
        doacao = self._repository.save(doacao)
        if confirmou_agora and self._agendar_email:
            # O texto é montado agora, com a sessão aberta; o envio roda depois da resposta.
            self._agendar_email(*email_de_confirmacao(doacao))
        return doacao

    # ---------- criação ----------

    def criar_monetaria(self, data: DoacaoMonetariaCreate, doador: Usuario) -> Doacao:
        instituicao = self._instituicoes.get_by_id(data.id_instituicao)
        if instituicao is None or not instituicao.usuario.ativo:
            raise NotFoundError("Instituição não encontrada.")
        if not instituicao.aceita_doacoes:
            raise UnprocessableError("Esta instituição não está aceitando doações no momento.")

        # Grava antes de cobrar: o id da doação vai para o MP como external_reference.
        doacao = self._repository.create(
            Doacao(
                id_usuario=doador.id_usuario,
                id_instituicao=instituicao.id_instituicao,
                tipo_doacao=TipoDoacao.monetaria,
                status=StatusDoacao.pendente,
                dinheiro=DoacaoDinheiro(
                    valor=data.valor,
                    forma_pagamento=data.forma_pagamento,
                    recorrente=data.recorrente,
                    cartao_final=data.cartao_final,
                ),
            )
        )

        descricao = f"Doação NPET para {instituicao.nome}"
        try:
            if data.forma_pagamento == FormaPagamento.pix:
                pagamento = self._gateway.create_pix_payment(
                    id_doacao=doacao.id_doacao,
                    valor=data.valor,
                    descricao=descricao,
                    email_pagador=doador.email,
                )
            else:
                pagamento = self._gateway.create_card_payment(
                    id_doacao=doacao.id_doacao,
                    valor=data.valor,
                    descricao=descricao,
                    email_pagador=doador.email,
                    card_token=data.card_token,
                    payment_method_id=data.payment_method_id,
                    issuer_id=data.issuer_id,
                )
        except AppError:
            # Falhou antes de existir pagamento: a doação fica no histórico como cancelada.
            doacao.status = StatusDoacao.cancelada
            self._repository.save(doacao)
            raise

        doacao = self._aplicar_e_salvar(doacao, pagamento)

        if data.forma_pagamento == FormaPagamento.cartao_credito and doacao.status == StatusDoacao.cancelada:
            raise PaymentRequiredError(_MOTIVOS_RECUSA.get(pagamento.status_detail or "", _MOTIVO_PADRAO))
        return doacao

    # ---------- consulta ----------

    def listar_minhas(self, usuario: Usuario) -> Sequence[Doacao]:
        return self._repository.list_monetarias_do_usuario(usuario.id_usuario)

    def _buscar_do_dono(self, id_doacao: int, usuario: Usuario, permitir_admin: bool = False) -> Doacao:
        doacao = self._repository.get_by_id(id_doacao)
        eh_admin = permitir_admin and usuario.tipo_usuario == TipoUsuario.administrador
        if (
            doacao is None
            or doacao.tipo_doacao != TipoDoacao.monetaria
            or (doacao.id_usuario != usuario.id_usuario and not eh_admin)
        ):
            # 404 também para doação de outra pessoa, para não revelar que ela existe.
            raise NotFoundError("Doação não encontrada.")
        return doacao

    def detalhar(self, id_doacao: int, usuario: Usuario) -> Doacao:
        doacao = self._buscar_do_dono(id_doacao, usuario, permitir_admin=True)
        if doacao.status == StatusDoacao.pendente and doacao.dinheiro.mp_payment_id:
            self._sincronizar(doacao)
        return doacao

    def _sincronizar(self, doacao: Doacao) -> None:
        try:
            pagamento = self._gateway.get_payment(doacao.dinheiro.mp_payment_id)
        except AppError as exc:
            # Sem resposta do MP, devolve o último estado conhecido; o webhook corrige depois.
            logger.warning("Não foi possível sincronizar a doação %s: %s", doacao.id_doacao, exc.message)
            return
        self._aplicar_e_salvar(doacao, pagamento)

    # ---------- alterações do doador ----------

    def alterar_recorrencia(self, id_doacao: int, recorrente: bool, usuario: Usuario) -> Doacao:
        doacao = self._buscar_do_dono(id_doacao, usuario)
        doacao.dinheiro.recorrente = recorrente
        return self._repository.save(doacao)

    def marcar_feedback_visto(self, id_doacao: int, usuario: Usuario) -> Doacao:
        doacao = self._buscar_do_dono(id_doacao, usuario)
        doacao.feedback_visto = True
        return self._repository.save(doacao)

    # ---------- webhook ----------

    def processar_notificacao(self, mp_payment_id: str) -> Doacao | None:
        """Busca o pagamento no MP (nunca confia no corpo do webhook) e atualiza a doação."""
        pagamento = self._gateway.get_payment(mp_payment_id)

        doacao = self._repository.get_by_mp_payment_id(pagamento.id)
        if doacao is None and (pagamento.external_reference or "").isdigit():
            # Caso a resposta da criação tenha se perdido (timeout) antes de gravar o id do MP.
            candidata = self._repository.get_by_id(int(pagamento.external_reference))
            if candidata and candidata.dinheiro and candidata.dinheiro.mp_payment_id is None:
                doacao = candidata

        if doacao is None:
            logger.info("Webhook do MP para pagamento desconhecido: %s", mp_payment_id)
            return None

        return self._aplicar_e_salvar(doacao, pagamento)
