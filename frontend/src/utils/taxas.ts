import type { FormaPagamento } from "../types/domain";

// Taxas de referência do Mercado Pago no Brasil (cartão de crédito à vista com recebimento na hora e PIX)
export const GATEWAY_FEE_RATE: Record<FormaPagamento, number> = {
    pix: 0.0099,
    cartao_credito: 0.0498,
};

// Taxa estimada em reais, arredondada para o centavo.
export function calculate_gateway_fee(value: number, method: FormaPagamento): number {
    return Math.round(value * 100 * GATEWAY_FEE_RATE[method]) / 100;
}

export function format_rate(rate: number): string {
    return `${(rate * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}