import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoNpet from "../../assets/logoNpet.png";
import CampoTexto from "../../components/CampoTexto/CampoTexto";
import Botao from "../../components/Botao/Botao";
import "./Cadastro.css";
import { format_phone, format_cpf } from "../../utils/formatacao";
import { is_valid_email, validate_password } from "../../utils/validacao";

type FormState = {
    nome: string;
    email: string;
    senha: string;
    confirmacaoSenha: string;
    telefone: string;
    cpf: string;
};

type ErrosState = Partial<Record<keyof FormState, string>>;

export default function Cadastro() {
    const api_url = import.meta.env.VITE_API_URL;

    const navigate = useNavigate();

    const [form, setForm] = useState<FormState>({
        nome: "",
        email: "",
        senha: "",
        confirmacaoSenha: "",
        telefone: "",
        cpf: "",
    });

    const [erros, setErros] = useState<ErrosState>({});
    const [carregando, setCarregando] = useState(false);
    const [erroGeral, setErroGeral] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState(false);

    // Telefone e CPF mantém como opcionais?
    const incompleto = Object.values(form).some(v => !v.trim());

    function set(campo: keyof FormState) {
        return (valor: string) => {
            setForm(f => ({ ...f, [campo]: valor }));
            if (erros[campo]) setErros(e => ({ ...e, [campo]: undefined }));
        };
    }

    function setCPF(raw: string) {
        setForm(f => ({ ...f, cpf: format_cpf(raw) }));
        if (erros.cpf) setErros(e => ({ ...e, cpf: undefined }));
    }

    function setTelefone(raw: string) {
        setForm(f => ({ ...f, telefone: format_phone(raw) }));
        if (erros.telefone) setErros(e => ({ ...e, telefone: undefined }));
    }

    function validar(): boolean {
        const novosErros: ErrosState = {};

        if (!form.nome.trim())
            novosErros.nome = "Nome é obrigatório.";

        if (!form.email.trim())
            novosErros.email = "E-mail é obrigatório.";
        else if (!is_valid_email(form.email))
            novosErros.email = "Informe um e-mail válido.";

        const erroSenha = validate_password(form.senha);
        if (erroSenha)
            novosErros.senha = erroSenha;

        if (!form.confirmacaoSenha)
            novosErros.confirmacaoSenha = "Confirme sua senha.";
        else if (form.senha !== form.confirmacaoSenha)
            novosErros.confirmacaoSenha = "As senhas não coincidem.";

        const telefoneSomenteDigitos = form.telefone.replace(/\D/g, "");
        if (form.telefone && telefoneSomenteDigitos.length < 10)
            novosErros.telefone = "Telefone incompleto.";

        const cpfSomenteDigitos = form.cpf.replace(/\D/g, "");
        if (form.cpf && cpfSomenteDigitos.length < 11)
            novosErros.cpf = "CPF incompleto.";

        setErros(novosErros);
        return Object.keys(novosErros).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErroGeral(null);

        if (!validar()) return;

        setCarregando(true);
        try {
            const response = await fetch(`${api_url}/users/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nome: form.nome,
                    email: form.email,
                    senha: form.senha,
                    telefone: form.telefone || undefined,
                    cpf: form.cpf.replace(/\D/g, "") || undefined,
                    tipo_usuario: "doador",
                }),
            });

            if (!response.ok) {
                throw new Error("Erro ao criar a conta.");
            }

            setSucesso(true);
        } catch {
            setErroGeral("Não foi possível criar a conta. Tente novamente.");
        } finally {
            setCarregando(false);
        }
    }

    if (sucesso) {
        return (
            <div className="cadastro-pagina">
                <div className="cadastro-card">
                    <div className="cadastro-topo">
                        <img src={logoNpet} alt="Logo NPET" className="cadastro-logo" />
                        <span className="cadastro-nome">NPET</span>
                    </div>
                    <hr className="cadastro-divisor-2" />
                    <div className="cadastro-sucesso">
                        <svg xmlns="http://www.w3.org/2000/svg" className="sucesso-icone" width="64" height="64" fill="#1a6e54" viewBox="0 0 256 256">
                            <path d="M253.66,133.66l-32,32a8,8,0,0,1-11.32,0l-16-16a8,8,0,0,1,11.32-11.32L216,148.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM144,157.68a68,68,0,1,0-71.9,0c-20.65,6.76-39.23,19.39-54.17,37.17A8,8,0,0,0,24,208H192a8,8,0,0,0,6.13-13.15C183.18,177.07,164.6,164.44,144,157.68Z"></path>
                        </svg>
                        <h2>Conta criada com sucesso!</h2>
                        <p>Bem-vindo ao NPET! Agora você pode fazer a diferença na vida de milhares de animais.</p>
                        <Botao
                            variant="primario"
                            size="md"
                            className="botao-login"
                            onClick={() => navigate("/login")}
                        >
                            Fazer login
                        </Botao>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cadastro-pagina">
            <div className="cadastro-card" role="main">
                <div className="cadastro-topo">
                    <img src={logoNpet} alt="Logo NPET" className="cadastro-logo" />
                    <span className="cadastro-nome">NPET</span>
                </div>
                    <p className="cadastro-subtitulo">
                        Crie sua conta e comece a fazer a diferença.
                    </p>

                <hr className="cadastro-divisor" />

                <form
                    className="cadastro-form"
                    onSubmit={handleSubmit}
                    noValidate
                    aria-label="Formulário de cadastro"
                >

                    <CampoTexto
                        label="Nome Completo"
                        variante="texto"
                        placeholder="Seu nome"
                        value={form.nome}
                        onChange={set("nome")}
                        required
                        erro={erros.nome}
                        autoComplete="name"
                    />

                    <CampoTexto
                        label="E-mail de Usuário"
                        variante="email"
                        value={form.email}
                        onChange={set("email")}
                        required
                        erro={erros.email}
                        autoComplete="email"
                    />

                    <div className="cadastro-linha-dupla">

                        <CampoTexto
                            label="Telefone"
                            variante="texto"
                            placeholder="(XX) XXXXX-XXXX"
                            className="campos-duplo"
                            value={form.telefone}
                            onChange={setTelefone}
                            erro={erros.telefone}
                            autoComplete="tel"
                        />

                        <CampoTexto
                            label="CPF"
                            variante="texto"
                            placeholder="XXX.XXX.XXX-XX"
                            className="campos-duplo"
                            value={form.cpf}
                            onChange={setCPF}
                            erro={erros.cpf}
                            autoComplete="off"
                        />
                    </div>

                    <CampoTexto
                        label="Senha"
                        variante="senha"
                        value={form.senha}
                        onChange={set("senha")}
                        required
                        erro={erros.senha}
                        autoComplete="new-password"
                    />

                    <CampoTexto
                        label="Confirmar Senha"
                        variante="senha"
                        value={form.confirmacaoSenha}
                        onChange={set("confirmacaoSenha")}
                        required
                        erro={erros.confirmacaoSenha}
                        autoComplete="new-password"
                    />

                    {erroGeral && (
                        <p className="cadastro-erro-geral" role="alert">
                            {erroGeral}
                        </p>
                    )}

                    <Botao
                        variant="primario"
                        size="md"
                        fullWidth
                        type="submit"
                        className="botao-cadastro"
                        disabled={carregando || incompleto}
                    >
                        {carregando ? "Criando Conta..." : "Criar Conta"}
                    </Botao>
                </form>

                <p className="cadastro-login">
                    Já tem uma conta?{" "}
                    <button
                        type="button"
                        className="cadastro-link"
                        onClick={() => navigate("/login")}
                    >
                        Fazer login
                    </button>
                </p>

            </div>
        </div>
    );
}