import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoNpet from "../../assets/logoNpet.png";
import Botao from "../../components/Botao/Botao";
import "./Login.css";

export default function Login() {
    const api_url = import.meta.env.VITE_API_URL;

    const navigate = useNavigate();

    const [email, setEmail]     = useState("");
    const [senha, setSenha]     = useState("");
    const [erro,  setErro]      = useState<string | null>(null);

    const [tipoUsuario, setTipoUsuario] = useState<"instituicao" | "doador">("doador");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErro(null);

        if (!email || !senha) {
            setErro("Preencha todos os campos.");
            return;
        }

        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!emailValido) {
            setErro("Digite um e-mail válido.");
            return;
        }

        try {

            /* 
            No ciclo 2 do NPET, não precisará de diferentes endpoints para login de
            diferentes tipos de usuário, mas por enquanto, precisa ser assim porque o
            back ainda não retorna o tipo de usuário.
            */

            const endpoint = 
                tipoUsuario === "instituicao" 
                    ? "institutions/auth/login" 
                    : "auth/login";

            const response = await fetch(`${api_url}/${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    email, 
                    password: senha })
            });

            const data = await response.json();

            if (!response.ok) {
                setErro(data.detail || "Erro ao fazer login.");
                return;
            }

            console.log("Login bem-sucedido:", data);
            
            /* 
            No ciclo 2 do NPET, aqui irá salvar o token!
            */
            localStorage.setItem("role", tipoUsuario);

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
                    {erro && (
                        <p className="login-erro" role="alert">{erro}</p>
                    )}
                    <fieldset className="login-campo">
                        <legend className="login-campo-label">E-mail de Usuário</legend>
                        <input
                            className="login-input"
                            type="email"
                            id="email"
                            placeholder="usuario@dominio.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                            aria-required="true"
                        />
                    </fieldset>

                    <fieldset className="login-campo">
                        <legend className="login-campo-label">Senha</legend>
                        <input
                            className="login-input"
                            id="senha"
                            type="password"
                            placeholder="••••••••"
                            value={senha}
                            onChange={e => setSenha(e.target.value)}
                            autoComplete="current-password"
                            required
                            aria-required="true"
                        />
                    </fieldset>
                    
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
                        onClick={() => {/* TODO */}}
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