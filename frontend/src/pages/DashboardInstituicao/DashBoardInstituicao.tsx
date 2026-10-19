import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import Botao from "../../components/Botao/Botao";
import "./DashBoardInstituicao.css";

export default function DashboardInstituicao() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    function sair() {
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <main className="dashboard-instituicao">
            <h2>Dashboard Instituição</h2>
            <p>Em construção!</p>

            <Botao onClick={sair}>Sair</Botao>
        </main>
    );
}