import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoNpet from "../../../public/logoNpet.png";
import Botao from "../../components/Botao/Botao";
import CampoTexto from "../../components/CampoTexto/CampoTexto";
import { request_password_reset } from "../../services/authService";
import "../Login/Login.css";
import "./EsqueciSenha.css";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EsqueciSenha() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [erroEmail, setErroEmail] = useState("");
    const [erro, setErro] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [enviado, setEnviado] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErro(null);
        setErroEmail("");

        if (!email.trim()) {
            setErroEmail("Preencha o e-mail.");
            return;
        }
        if (!REGEX_EMAIL.test(email.trim())) {
            setErroEmail("Digite um e-mail válido.");
            return;
        }

        setCarregando(true);
        try {
            await request_password_reset(email.trim());
            setEnviado(true);
        } catch (err) {
            setErro(err instanceof Error ? err.message : "Não foi possível enviar o link.");
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="login-pagina">
            <div className="login-card" role="main">
                <div className="login-topo">
                    <img src={logoNpet} alt="Logo NPET" className="login-logo" />
                    <span className="login-nome">NPET</span>
                </div>

                <hr className="login-divisor" />

                {enviado ? (
                    <div className="recuperacao-sucesso">
                        <h2>Verifique seu e-mail</h2>
                        <p>
                            Se <strong>{email.trim()}</strong> estiver cadastrado, enviamos um link para
                            redefinir sua senha. Ele vale por 15 minutos e só pode ser usado uma vez.
                        </p>
                        <p className="recuperacao-dica">
                            Não encontrou? Confira a caixa de spam.
                        </p>
                        <Botao
                            variant="primario"
                            size="md"
                            fullWidth
                            onClick={() => navigate("/login")}
                        >
                            Voltar ao login
                        </Botao>
                    </div>
                ) : (
                    <form
                        className="login-form"
                        onSubmit={handleSubmit}
                        noValidate
                        aria-label="Formulário de recuperação de senha"
                    >
                        <h2 className="recuperacao-titulo">Esqueceu a senha?</h2>
                        <p className="recuperacao-texto">
                            Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
                        </p>

                        {erro && <p className="login-erro">{erro}</p>}

                        <CampoTexto
                            label="E-mail de Usuário"
                            variante="email"
                            value={email}
                            onChange={setEmail}
                            autoComplete="email"
                            required
                            erro={erroEmail}
                        />

                        <Botao
                            variant="primario"
                            size="md"
                            fullWidth
                            type="submit"
                            className="btn-login"
                            disabled={!email || carregando}
                        >
                            {carregando ? "Enviando..." : "Enviar link"}
                        </Botao>
                    </form>
                )}

                {!enviado && (
                    <p className="login-criar-conta">
                        Lembrou a senha?{" "}
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