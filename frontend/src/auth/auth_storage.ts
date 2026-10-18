import type { TipoUsuario } from "../types/domain";

export const TOKEN_KEY = "token";
export const ROLE_KEY = "role";
export const UNAUTHORIZED_EVENT = "npet:unauthorized";

const VALID_ROLES: readonly TipoUsuario[] = ["administrador", "instituicao", "doador"];

export interface Session {
    token: string;
    tipoUsuario: TipoUsuario;
}

function is_valid_role(value: string | null): value is TipoUsuario {
    return value !== null && (VALID_ROLES as readonly string[]).includes(value);
}

export function get_token_expiration_ms(token: string): number | null {
    try {
        const payload_part = token.split(".")[1];
        const base64 = payload_part.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
        const payload = JSON.parse(atob(padded)) as { exp?: number };
        return typeof payload.exp === "number" ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
}

export function is_token_expired(token: string): boolean {
    const expiration_ms = get_token_expiration_ms(token);
    return expiration_ms !== null && expiration_ms <= Date.now();
}

export function get_token(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export function save_session(session: Session): void {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(ROLE_KEY, session.tipoUsuario);
}

export function clear_session(): void {
    try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ROLE_KEY);
    } catch {
        // Storage indisponível (modo privado, bloqueio de cookies): nada a limpar.
    }
}

export function read_session(): Session | null {
    try {
        const token = localStorage.getItem(TOKEN_KEY);
        const role = localStorage.getItem(ROLE_KEY);

        if (!token || !is_valid_role(role)) return null;

        if (is_token_expired(token)) {
            clear_session();
            return null;
        }

        return { token, tipoUsuario: role };
    } catch {
        return null;
    }
}

export function notify_unauthorized(): void {
    clear_session();
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}