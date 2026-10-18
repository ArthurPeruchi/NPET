import type { ReactNode } from "react";
import { Navigate, useLocation, type Location } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function RotaAnonima({ children }: { children: ReactNode }) {
    const { autenticado } = useAuth();
    const location = useLocation();

    if (autenticado) {
        const origem = (location.state as { from?: Location } | null)?.from;
        return <Navigate to={origem ?? "/"} state={origem?.state} replace />;
    }

    return <>{children}</>;
}