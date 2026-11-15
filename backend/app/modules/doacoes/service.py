import logging
from collections.abc import Sequence

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


def aplicar_pagamento(doacao: Doacao, pagamento: PagamentoMP) -> None:
    """Copia o estado do pagamento do MP para a doação (idempotente)."""
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


class DoacaoService:
    def __init__(
        self,
        repository: DoacaoRepository,
        instituicoes: InstituicaoRepository,
        gateway: MercadoPagoGateway,
    ) -> None:
        self._repository = repository
        self._instituicoes = instituicoes
        self._gateway = gateway

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

        aplicar_pagamento(doacao, pagamento)
        self._repository.save(doacao)

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
        aplicar_pagamento(doacao, pagamento)
        self._repository.save(doacao)

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

        aplicar_pagamento(doacao, pagamento)
        return self._repository.save(doacao)
