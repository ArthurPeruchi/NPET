import type { PerfilUsuario } from "../types/domain";
import { request } from "./apiClient";

export interface ProfileUpdate {
    nome?: string;
    email?: string;
    telefone?: string;
    cpf?: string;
    senha?: string;
    senha_atual?: string;
}

export function get_my_profile(): Promise<PerfilUsuario> {
    return request<PerfilUsuario>("users/me", {
        fallback_error: "Não foi possível carregar seu perfil.",
    });
}

export function update_my_profile(changes: ProfileUpdate): Promise<PerfilUsuario> {
    return request<PerfilUsuario>("users/me", {
        method: "PATCH",
        body: changes,
        end_session_on_401: changes.senha_atual === undefined, // Com senha_atual na requisição, um 401 significa senha incorreta (e não sessão expirada).
        fallback_error: "Não foi possível atualizar seus dados.",
    });
}

// Desativa a própria conta; o backend confirma a senha antes de desativar.
export function deactivate_my_account(password: string): Promise<void> {
    return request<void>("users/me/deactivate", {
        method: "POST",
        body: { senha: password },
        end_session_on_401: false,
        fallback_error: "Não foi possível desativar sua conta.",
    });
}