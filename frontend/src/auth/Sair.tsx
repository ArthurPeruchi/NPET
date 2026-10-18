import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function Sair() {
    const { logout } = useAuth();

    useEffect(() => {
        logout();
    }, [logout]);

    return <Navigate to="/" replace />;
}
