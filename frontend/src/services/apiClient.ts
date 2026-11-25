import { get_token, notify_unauthorized } from "../auth/auth_storage";

const API_URL = import.meta.env.VITE_API_URL;

type RequestOptions = {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    end_session_on_401?: boolean; // Quando false, um 401 vira erro comum da operação (ex.: "senha atual incorreta") em vez de encerrar a sessão do usuário.
    fallback_error?: string;
};

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

function extract_error_message(data: unknown, fallback: string): string {
    const detail = (data as { detail?: unknown } | null)?.detail;
    return typeof detail === "string" ? detail : fallback;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
        method = "GET",
        body,
        end_session_on_401 = true,
        fallback_error = "Não foi possível concluir a operação.",
    } = options;

    const token = get_token();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    let response: Response;
    try {
        response = await fetch(`${API_URL}/${endpoint}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new ApiError("Não foi possível conectar ao servidor. Verifique sua conexão.", 0);
    }

    // Avisa o AuthProvider quando a sessão expira (token ausente ou expirado), para que ele limpe a sessão do usuário.
    if (response.status === 401 && end_session_on_401) {
        notify_unauthorized();
        throw new ApiError("Sessão expirada. Faça login novamente.", 401);
    }

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError(extract_error_message(data, fallback_error), response.status);
    }

    // Respostas sem conteúdo (204) não têm corpo para ler.
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
}