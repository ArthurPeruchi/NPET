import { request } from "./apiClient";
import type { DoacaoMonetaria, DoacaoRegistrada, FormaPagamento } from "../types/domain";

// Dados enviados ao backend para criar uma doação monetária.
// Do cartão seguem apenas o token e a bandeira gerados pelo Mercado Pago, nunca o número.
export interface NewMonetaryDonation {
    idInstituicao: number;
    valor: number;
    formaPagamento: FormaPagamento;
    recorrente: boolean;
    cardToken?: string;
    paymentMethodId?: string;
    cartaoFinal?: string;
}

// Cria a doação e o pagamento. Cartão recusado volta como erro 402 (ApiError) com o motivo.
export function register_donation(data: NewMonetaryDonation): Promise<DoacaoMonetaria> {
    return request<DoacaoMonetaria>("doacoes/monetarias", {
        method: "POST",
        body: data,
        fallback_error: "Não foi possível registrar sua doação.",
    });
}

// Mais recentes primeiro.
export function list_donation_history(): Promise<DoacaoRegistrada[]> {
    return request<DoacaoRegistrada[]>("doacoes/me", {
        fallback_error: "Não foi possível carregar o histórico de doações.",
    });
}

// Se a doação estiver pendente, o backend consulta o Mercado Pago antes de responder.
export function get_donation(donation_id: number): Promise<DoacaoMonetaria> {
    return request<DoacaoMonetaria>(`doacoes/${donation_id}`, {
        fallback_error: "Não foi possível consultar a doação.",
    });
}

// Liga ou desliga o lembrete mensal de uma doação monetária.
export function set_donation_recurrence(donation_id: number, recorrente: boolean): Promise<DoacaoMonetaria> {
    return request<DoacaoMonetaria>(`doacoes/${donation_id}/recorrencia`, {
        method: "PATCH",
        body: { recorrente },
        fallback_error: "Não foi possível alterar a recorrência.",
    });
}

export function mark_feedback_seen(donation_id: number): Promise<DoacaoMonetaria> {
    return request<DoacaoMonetaria>(`doacoes/${donation_id}/feedback-visto`, {
        method: "PATCH",
        fallback_error: "Não foi possível marcar o feedback como visto.",
    });
}