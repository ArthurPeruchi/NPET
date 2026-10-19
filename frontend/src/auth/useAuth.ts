import { createContext, useContext } from "react";
import type { TipoUsuario } from "../types/domain";

export interface AuthContextType {
    token: string | null;
    tipoUsuario: TipoUsuario | null;
    autenticado: boolean;
    login: (token: string, tipoUsuario: TipoUsuario) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);

    if (!ctx) {
        throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
    }

    return ctx;
}
