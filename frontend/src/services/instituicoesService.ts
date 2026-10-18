import type { Instituicao } from "../types/domain";

const api_url = import.meta.env.VITE_API_URL;

// O backend devolve o logo como caminho relativo (ex.: /static/instituicoes/logo.png).
function resolverLogo(inst: Instituicao): Instituicao {
    return inst.logo ? { ...inst, logo: new URL(inst.logo, api_url).href } : inst;
}

async function requisitar<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${api_url}/${endpoint}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    // Token ausente ou expirado: limpa a sessão e volta para o login.
    if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/";
        throw new Error("Sessão expirada. Faça login novamente.");
    }

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail ?? "Não foi possível carregar as instituições.");
    }
    return response.json();
}

export async function listarInstituicoes(): Promise<Instituicao[]> {
    const instituicoes = await requisitar<Instituicao[]>("instituicoes");
    return instituicoes.map(resolverLogo);
}

export async function buscarInstituicao(id: number): Promise<Instituicao> {
    return resolverLogo(await requisitar<Instituicao>(`instituicoes/${id}`));
}
