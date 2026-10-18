import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoNpet from "../../assets/logoNpet.png";
import CampoTexto from "../../components/CampoTexto/CampoTexto";
import Botao from "../../components/Botao/Botao";
import "./Cadastro.css";

function formatarCPF(raw: string): string {
    const d = raw.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatarTelefone(raw: string): string {
    const d = raw.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

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
        setForm(f => ({ ...f, cpf: formatarCPF(raw) }));
        if (erros.cpf) setErros(e => ({ ...e, cpf: undefined }));
    }

    function setTelefone(raw: string) {
        setForm(f => ({ ...f, telefone: formatarTelefone(raw) }));
        if (erros.telefone) setErros(e => ({ ...e, telefone: undefined }));
    }

    function validar(): boolean {
        const novosErros: ErrosState = {};

        if (!form.nome.trim())
            novosErros.nome = "Nome é obrigatório.";

        if (!form.email.trim())
            novosErros.email = "E-mail é obrigatório.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            novosErros.email = "Informe um e-mail válido.";

        if (!form.senha)
            novosErros.senha = "Senha é obrigatória.";
        else if (form.senha.length < 8)
            novosErros.senha = "A senha deve ter no mínimo 8 caracteres.";

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
            const response = await fetch(`${api_url}/auth/register`, {
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
                    <hr className="cadastro-divisor" />
                    <div className="cadastro-sucesso">
                        <span className="cadastro-sucesso-icone" aria-hidden="true">🐾</span>
                        <h2>Conta criada com sucesso!</h2>
                        <p>Bem-vindo ao NPET. Agora você pode fazer a diferença na vida de milhares de animais.</p>
                        <Botao
                            variant="primario"
                            size="lg"
                            fullWidth
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
                        onClick={() => navigate("/")}
                    >
                        Fazer login
                    </button>
                </p>

            </div>
        </div>
    );
}