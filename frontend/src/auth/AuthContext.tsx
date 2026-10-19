import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { TipoUsuario } from "../types/domain";
import { AuthContext } from "./useAuth";
import {ROLE_KEY, TOKEN_KEY, UNAUTHORIZED_EVENT, clear_session,
        get_token_expiration_ms, read_session, save_session, type Session,
} from "./auth_storage";

// Maior atraso aceito pelo setTimeout (~24,8 dias).
const MAX_TIMEOUT_MS = 2_147_483_647;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, set_session] = useState<Session | null>(read_session);

    const login = useCallback((token: string, tipoUsuario: TipoUsuario) => {
        const new_session: Session = { token, tipoUsuario };
        save_session(new_session);
        set_session(new_session);
    }, []);

    const logout = useCallback(() => {
        clear_session();
        set_session(null);
    }, []);

    // 401 vindo dos services e logout/login feito em outra aba.
    useEffect(() => {
        function handle_storage(event: StorageEvent) {
            if (event.key === null || event.key === TOKEN_KEY || event.key === ROLE_KEY) {
                set_session(read_session());
            }
        }

        window.addEventListener(UNAUTHORIZED_EVENT, logout);
        window.addEventListener("storage", handle_storage);

        return () => {
            window.removeEventListener(UNAUTHORIZED_EVENT, logout);
            window.removeEventListener("storage", handle_storage);
        };
    }, [logout]);

    // Encerra a sessão no instante em que o JWT expira (sem esperar o primeiro 401).
    useEffect(() => {
        if (!session) return;

        const expiration_ms = get_token_expiration_ms(session.token);
        if (expiration_ms === null) return;

        const delay_ms = Math.min(Math.max(expiration_ms - Date.now(), 0), MAX_TIMEOUT_MS);
        const timer_id = window.setTimeout(logout, delay_ms);

        return () => window.clearTimeout(timer_id);
    }, [session, logout]);

    const value = useMemo(
        () => ({
            token: session?.token ?? null,
            tipoUsuario: session?.tipoUsuario ?? null,
            autenticado: session !== null,
            login,
            logout,
        }),
        [session, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}