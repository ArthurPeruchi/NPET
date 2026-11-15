import type { FormaPagamento, StatusDoacao } from "../../types/domain";

// Textos exibidos ao usuário, para que o card e a busca usem exatamente as mesmas palavras.
export const ROTULO_STATUS: Record<StatusDoacao, string> = {
    confirmada: "Concluída",
    pendente: "Aguardando",
    cancelada: "Cancelada",
};

export const ROTULO_FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
    pix: "PIX",
    cartao_credito: "Cartão de Crédito",
};