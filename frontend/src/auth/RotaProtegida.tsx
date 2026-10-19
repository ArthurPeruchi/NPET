import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { TipoUsuario } from "../types/domain";
import { useAuth } from "./useAuth";

type RotaProtegidaProps = {
    children: ReactNode;
    papeis?: TipoUsuario[];
};

export default function RotaProtegida({ children, papeis }: RotaProtegidaProps) {
    const { autenticado, tipoUsuario } = useAuth();
    const location = useLocation();

    if (!autenticado) {
        // "from" guarda a rota e o state para voltar após o login.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (papeis && tipoUsuario && !papeis.includes(tipoUsuario)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
