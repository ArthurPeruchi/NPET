import { request } from "./apiClient";

// O backend responde igual exista ou não o e-mail, então a tela nunca revela se uma conta está cadastrada.
export function request_password_reset(email: string): Promise<void> {
    return request<void>("auth/forgot-password", {
        method: "POST",
        body: { email },
        end_session_on_401: false,
        fallback_error: "Não foi possível enviar o link. Tente novamente mais tarde.",
    });
}

// Define a nova senha a partir do token recebido por e-mail (uso único, 15 minutos).
export function reset_password(token: string, new_password: string): Promise<void> {
    return request<void>("auth/reset-password", {
        method: "POST",
        body: { token, nova_senha: new_password },
        end_session_on_401: false,
        fallback_error: "Não foi possível redefinir a senha. Tente novamente.",
    });
}