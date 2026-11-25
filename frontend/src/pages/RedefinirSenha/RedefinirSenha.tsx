import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logoNpet from "../../../public/logoNpet.png";
import Botao from "../../components/Botao/Botao";
import CampoTexto from "../../components/CampoTexto/CampoTexto";
import { reset_password } from "../../services/authService";
import { validate_password } from "../../utils/validacao";
import "../Login/Login.css";
import "../EsqueciSenha/EsqueciSenha.css";

export default function RedefinirSenha() {
    const navigate = useNavigate();
    const [search_params] = useSearchParams();

    const token = search_params.get("token") ?? "";

    const [senha, setSenha] = useState("");
    const [confirmacao, setConfirmacao] = useState("");
    const [erroSenha, setErroSenha] = useState("");
    const [erroConfirmacao, setErroConfirmacao] = useState("");
    const [erro, setErro] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [concluido, setConcluido] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErro(null);

        const mensagem_senha = validate_password(senha) ?? "";
        const mensagem_confirmacao = !confirmacao
            ? "Confirme sua senha."
            : senha !== confirmacao
              ? "As senhas não coincidem."
              : "";

        setErroSenha(mensagem_senha);
        setErroConfirmacao(mensagem_confirmacao);
        if (mensagem_senha || mensagem_confirmacao) return;

        setCarregando(true);
        try {
            await reset_password(token, senha);
            setConcluido(true);
        } catch (err) {
            setErro(err instanceof Error ? err.message : "Não foi possível redefinir a senha.");
        } finally {
            setCarregando(false);
        }
    }

    function renderizar_conteudo() {
        if (concluido) {
            return (
                <div className="recuperacao-sucesso">
                    <h2>Senha redefinida!</h2>
                    <p>Sua senha foi alterada com sucesso. Agora você já pode entrar com a nova senha.</p>
                    <Botao variant="primario" size="md" fullWidth onClick={() => navigate("/login")}>
                        Fazer login
                    </Botao>
                </div>
            );
        }

        if (!token) {
            return (
                <div className="recuperacao-sucesso">
                    <h2>Link inválido</h2>
                    <p>Este link de redefinição está incompleto. Solicite um novo para continuar.</p>
                    <Botao variant="primario" size="md" fullWidth onClick={() => navigate("/esqueci-senha")}>
                        Solicitar novo link
                    </Botao>
                </div>
            );
        }

        return (
            <form
                className="login-form"
                onSubmit={handleSubmit}
                noValidate
                aria-label="Formulário de redefinição de senha"
            >
                <h2 className="recuperacao-titulo">Criar nova senha</h2>
                <p className="recuperacao-texto">
                    Use de 8 a 72 caracteres, com letra maiúscula, minúscula e número.
                </p>

                {erro && (
                    <p className="login-erro">
                        {erro}{" "}
                        <button
                            type="button"
                            className="login-link"
                            onClick={() => navigate("/esqueci-senha")}
                        >
                            Solicitar novo link
                        </button>
                    </p>
                )}

                <CampoTexto
                    label="Nova Senha"
                    variante="senha"
                    value={senha}
                    onChange={setSenha}
                    autoComplete="new-password"
                    required
                    erro={erroSenha}
                />

                <CampoTexto
                    label="Confirmar Nova Senha"
                    variante="senha"
                    value={confirmacao}
                    onChange={setConfirmacao}
                    autoComplete="new-password"
                    required
                    erro={erroConfirmacao}
                />

                <Botao
                    variant="primario"
                    size="md"
                    fullWidth
                    type="submit"
                    className="btn-login"
                    disabled={!senha || !confirmacao || carregando}
                >
                    {carregando ? "Salvando..." : "Redefinir senha"}
                </Botao>
            </form>
        );
    }

    return (
        <div className="login-pagina">
            <div className="login-card" role="main">
                <div className="login-topo">
                    <img src={logoNpet} alt="Logo NPET" className="login-logo" />
                    <span className="login-nome">NPET</span>
                </div>

                <hr className="login-divisor" />

                {renderizar_conteudo()}

                {!concluido && (
                    <p className="login-criar-conta">
                        <button
                            type="button"
                            className="login-link"
                            onClick={() => navigate("/login")}
                        >
                            Voltar ao login
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
}