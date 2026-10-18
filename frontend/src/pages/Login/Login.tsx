import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoNpet from "../../assets/logoNpet.png";
import Botao from "../../components/Botao/Botao";
import CampoTexto from "../../components/CampoTexto/CampoTexto";
import "./Login.css";

export default function Login() {
    const api_url = import.meta.env.VITE_API_URL;

    const navigate = useNavigate();

    const [email, setEmail]     = useState("");
    const [senha, setSenha]     = useState("");
    const [erro,  setErro]      = useState<string | null>(null);
    const [erroEmail, setErroEmail] = useState("");
    const [erroSenha, setErroSenha] = useState("");

    const [tipoUsuario, setTipoUsuario] = useState<"instituicao" | "doador">("doador");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErro(null);
        setErroEmail("");
        setErroSenha("");

        let emailInvalido = "";
        let senhaInvalida = "";

        if (!email.trim()) {
            emailInvalido = "Preencha o e-mail.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            emailInvalido = "Digite um e-mail válido.";
        }

        if (!senha) {
            senhaInvalida = "Preencha a senha.";
        }

        setErroEmail(emailInvalido);
        setErroSenha(senhaInvalida);

        if (emailInvalido || senhaInvalida) {
            return;
        }

        try {
            const response = await fetch(`${api_url}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

           if (!response.ok) {
                const mensagem = data.detail || "Erro ao fazer login.";

                if (mensagem.toLowerCase().includes("e-mail ou senha inválidos")) {
                    setErroEmail(" ");
                    setErroSenha(" ");
                    setErro("E-mail ou senha inválidos.");
                } else {
                    setErro(mensagem);
                }

                return;
            }

            localStorage.setItem("token", data.access_token);
            localStorage.setItem("role", data.tipo_usuario);

            setTimeout(() => {
                navigate("/inicio");
            }, 100);

        }catch (err) {
            console.error("Erro ao fazer login:", err);
            setErro("Erro ao fazer login. Tente novamente mais tarde.");
        }
    }
    
    return (
        <div className="login-pagina">
            <div className="login-card" role="main">

                <div className="login-topo">
                    <img
                        src={logoNpet}
                        alt="Logo NPET"
                        className="login-logo"
                        />
                    <span className="login-nome">NPET</span>
                </div>

                <hr className="login-divisor" />

                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                    noValidate
                    aria-label="Formulário de login"
                >
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

                    <CampoTexto
                        label="Senha"
                        variante="senha"
                        value={senha}
                        onChange={setSenha}
                        autoComplete="current-password"
                        required
                        erro={erroSenha}
                    />

                    <button
                        type="button"
                        className="login-link"
                        onClick={() => {/* TODO */}}
                    >
                        Esqueceu a senha?
                    </button>

                    <Botao
                        variant="primario"
                        size="md"
                        fullWidth
                        type="submit"
                        className="btn-login"
                        disabled={!email || !senha}
                    >
                        Entrar
                    </Botao>
                </form>

                <p className="login-criar-conta">
                    Não tem uma conta?{" "}
                    <button
                        type="button"
                        className="login-link"
                        onClick={() => navigate("/cadastro")}
                    >
                        Criar nova conta
                    </button>
                </p>

                <hr className="login-divisor" />
                <div className="login-tipo-usuario">
                    <p className="login-tipo-usuario">
                        Mude o tipo de usuário nos botões abaixo! Está assim por enquanto
                        porque o backend ainda não retorna a role do usuário; será ajustado 
                        no Ciclo 2.
                    </p>

                    <p className="login-tipo-atual">
                        Tipo de usuário atual: <strong>{tipoUsuario}</strong>
                    </p>

                    <div className="login-tipo-botoes">
                        <Botao
                            size="sm"
                            className="btn-login-tipo"
                            onClick={() => setTipoUsuario("doador")}
                        >
                            Doador
                        </Botao>

                        <Botao
                            size="sm"
                            className="btn-login-tipo"
                            onClick={() => setTipoUsuario("instituicao")}
                        >
                            Instituição
                        </Botao>
                    </div>
                </div>
            </div>
        </div>
    );
}