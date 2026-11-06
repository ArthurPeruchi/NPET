import type { DoacaoMonetaria, DoacaoRegistrada, FormaPagamento, StatusDoacao } from "../types/domain";
import { get_token, get_user_id } from "../auth/auth_storage";

/*
 * OBS.: É UMA SIMULAÇÃO, porque o backend ainda não possui os endpoints de doação (POST/GET /doacoes).
 * Enquanto isso, o registro fica no localStorage, separado por usuário, com o mesmo
 * formato de DoacaoMonetaria que a API devolverá. Ao integrar o backend, basta trocar
 * o corpo de register_donation e list_donation_history por chamadas fetch.
 */

const HISTORY_KEY_PREFIX = "npet:historico_doacoes:";
const SIMULATED_LATENCY_MS = 1800;

// Chave fictícia exibida no pop-up de PIX (no backend, virá da cobrança gerada).
export const SIMULATED_PIX_KEY = "chavepix@npetsolidario.org.br";

export interface NewMonetaryDonation {
    idInstituicao: number;
    valor: number;
    formaPagamento: FormaPagamento;
    recorrente: boolean;
    cartaoFinal?: string;
}

function get_history_key(): string {
    const token = get_token();
    const user_id = token ? get_user_id(token) : null;

    if (!user_id) {
        throw new Error("Sessão expirada. Faça login novamente.");
    }

    return `${HISTORY_KEY_PREFIX}${user_id}`;
}

function read_history(history_key: string): DoacaoRegistrada[] {
    try {
        const raw = localStorage.getItem(history_key);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? (parsed as DoacaoRegistrada[]) : [];
    } catch {
        return [];
    }
}

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// PIX fica pendente até a confirmação do pagamento; cartão é processado na hora.
function get_initial_status(forma_pagamento: FormaPagamento): StatusDoacao {
    return forma_pagamento === "pix" ? "pendente" : "confirmada";
}

export async function register_donation(data: NewMonetaryDonation): Promise<DoacaoMonetaria> {
    const history_key = get_history_key();
    const token = get_token() as string;

    await wait(SIMULATED_LATENCY_MS);

    const history = read_history(history_key);
    const next_id = history.reduce((max_id, d) => Math.max(max_id, d.id), 0) + 1;

    const donation: DoacaoMonetaria = {
        id: next_id,
        idUsuario: Number(get_user_id(token)),
        idInstituicao: data.idInstituicao,
        tipoDoacao: "monetaria",
        status: get_initial_status(data.formaPagamento),
        criadaEm: new Date().toISOString(),
        valor: data.valor,
        formaPagamento: data.formaPagamento,
        recorrente: data.recorrente,
        cartaoFinal: data.cartaoFinal,
    };

    try {
        localStorage.setItem(history_key, JSON.stringify([donation, ...history]));
    } catch {
        throw new Error("Não foi possível registrar sua doação. Tente novamente.");
    }

    return donation;
}

// Mais recentes primeiro.
export async function list_donation_history(): Promise<DoacaoRegistrada[]> {
    return read_history(get_history_key());
}

// Liga ou desliga a recorrência mensal de uma doação monetária.
export async function set_donation_recurrence(donation_id: number, recorrente: boolean): Promise<void> {
    const history_key = get_history_key();
    const history = read_history(history_key);

    const target = history.find(d => d.id === donation_id);
    if (!target || target.tipoDoacao !== "monetaria") {
        throw new Error("Doação não encontrada.");
    }

    const updated = history.map(d => (d.id === donation_id ? { ...d, recorrente } : d));

    try {
        localStorage.setItem(history_key, JSON.stringify(updated));
    } catch {
        throw new Error("Não foi possível salvar a alteração. Tente novamente.");
    }
}