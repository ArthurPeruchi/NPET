import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../../components/NavBar/NavBar";
import Rodape from "../../components/Rodape/Rodape";
import CampoTexto from "../../components/CampoTexto/CampoTexto";
import Botao from "../../components/Botao/Botao";
import ModalConfirmacao from "../../components/ModalConfirmacao/ModalConfirmacao";
import { useAuth } from "../../auth/useAuth";
import usePerfil from "../../hooks/usePerfil";
import { deactivate_my_account, update_my_profile, type ProfileUpdate } from "../../services/usuariosService";
import type { PerfilUsuario } from "../../types/domain";
import { format_cpf, format_phone } from "../../utils/formatacao";
import { is_valid_email, validate_password } from "../../utils/validacao";
import "./Perfil.css";

type CampoPerfil = "nome" | "email" | "telefone" | "cpf";
type DadosPerfil = Record<CampoPerfil, string>;
type ErrosPerfil = Partial<Record<CampoPerfil, string>>;

type CampoSenha = "atual" | "nova" | "confirmacao";
type DadosSenha = Record<CampoSenha, string>;
type ErrosSenha = Partial<Record<CampoSenha, string>>;

type ConfigCampo = {
    chave: CampoPerfil;
    label: string;
    variante: "texto" | "email";
    placeholder: string;
    autocomplete: string;
    formatar?: (raw: string) => string;
};

const CAMPOS: ConfigCampo[] = [
    { chave: "nome", label: "Nome Completo", variante: "texto", placeholder: "Seu nome", autocomplete: "name" },
    { chave: "email", label: "E-mail de Usuário", variante: "email", placeholder: "usuario@dominio.com", autocomplete: "email" },
    { chave: "telefone", label: "Telefone", variante: "texto", placeholder: "(XX) XXXXX-XXXX", autocomplete: "tel", formatar: format_phone },
    { chave: "cpf", label: "CPF", variante: "texto", placeholder: "XXX.XXX.XXX-XX", autocomplete: "off", formatar: format_cpf },
];

const SENHA_VAZIA: DadosSenha = { atual: "", nova: "", confirmacao: "" };

function to_dados_perfil(perfil: PerfilUsuario): DadosPerfil {
    return {
        nome: perfil.nome,
        email: perfil.email,
        telefone: format_phone(perfil.telefone ?? ""),
        cpf: format_cpf(perfil.cpf ?? ""),
    };
}

// Iniciais para o avatar: primeira letra do primeiro e do último nome.
function get_initials(nome: string): string {
    const parts = nome.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
}

function validate_profile(changed: Partial<DadosPerfil>): ErrosPerfil {
    const erros: ErrosPerfil = {};

    if (changed.nome !== undefined && !changed.nome.trim())
        erros.nome = "Nome é obrigatório.";

    if (changed.email !== undefined) {
        if (!changed.email.trim()) erros.email = "E-mail é obrigatório.";
        else if (!is_valid_email(changed.email.trim())) erros.email = "Informe um e-mail válido.";
    }

    if (changed.telefone !== undefined) {
        const digits = changed.telefone.replace(/\D/g, "");
        if (digits.length === 0) erros.telefone = "Telefone é obrigatório.";
        else if (digits.length < 10) erros.telefone = "Telefone incompleto.";
    }

    if (changed.cpf !== undefined) {
        const digits = changed.cpf.replace(/\D/g, "");
        if (digits.length === 0) erros.cpf = "CPF é obrigatório.";
        else if (digits.length < 11) erros.cpf = "CPF incompleto.";
    }

    return erros;
}

function validate_password_change(senhas: DadosSenha): ErrosSenha {
    const erros: ErrosSenha = {};

    if (!senhas.atual) erros.atual = "Informe sua senha atual.";

    const erro_nova = validate_password(senhas.nova);
    if (erro_nova) erros.nova = erro_nova;
    else if (senhas.nova === senhas.atual) erros.nova = "A nova senha deve ser diferente da atual.";

    if (!senhas.confirmacao) erros.confirmacao = "Confirme a nova senha.";
    else if (senhas.nova !== senhas.confirmacao) erros.confirmacao = "As senhas não coincidem.";

    return erros;
}

export default function Perfil() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { perfil, carregando, erro, set_perfil } = usePerfil();

    // Um campo está em edição quando tem rascunho; sem rascunho, mostra o valor salvo.
    const [rascunho, setRascunho] = useState<Partial<DadosPerfil>>({});
    const [erros, setErros] = useState<ErrosPerfil>({});
    const [salvando, setSalvando] = useState(false);
    const [erro_geral, setErroGeral] = useState<string | null>(null);
    const [mensagem, setMensagem] = useState<string | null>(null);

    const [senha_aberta, setSenhaAberta] = useState(false);
    const [senhas, setSenhas] = useState<DadosSenha>(SENHA_VAZIA);
    const [erros_senha, setErrosSenha] = useState<ErrosSenha>({});
    const [erro_senha_geral, setErroSenhaGeral] = useState<string | null>(null);
    const [salvando_senha, setSalvandoSenha] = useState(false);

    const [desativar_aberto, setDesativarAberto] = useState(false);
    const [senha_desativar, setSenhaDesativar] = useState("");
    const [erro_desativar, setErroDesativar] = useState<string | null>(null);
    const [desativando, setDesativando] = useState(false);

    const salvo = useMemo(() => (perfil ? to_dados_perfil(perfil) : null), [perfil]);

    const campos_alterados = salvo
        ? (Object.keys(rascunho) as CampoPerfil[]).filter(c => (rascunho[c] ?? "").trim() !== salvo[c])
        : [];

    function handle_discard_all() {
        setRascunho({});
        setErros({});
        setErroGeral(null);
    }

    function handle_change(config: ConfigCampo, raw: string) {
        const valor = config.formatar ? config.formatar(raw) : raw;
        setMensagem(null);
        setRascunho(r => ({ ...r, [config.chave]: valor }));
        if (erros[config.chave]) setErros(e => ({ ...e, [config.chave]: undefined }));
    }

    async function handle_save(e?: React.FormEvent) {
        e?.preventDefault();
        if (!salvo || salvando || campos_alterados.length === 0) return;

        setErroGeral(null);

        const alterados: Partial<DadosPerfil> = {};
        for (const campo of campos_alterados) alterados[campo] = (rascunho[campo] ?? "").trim();

        const novos_erros = validate_profile(alterados);
        setErros(novos_erros);
        if (Object.keys(novos_erros).length > 0) return;

        const mudancas: ProfileUpdate = {};
        if (alterados.nome !== undefined) mudancas.nome = alterados.nome;
        if (alterados.email !== undefined) mudancas.email = alterados.email;
        if (alterados.telefone !== undefined) mudancas.telefone = alterados.telefone;
        if (alterados.cpf !== undefined) mudancas.cpf = alterados.cpf.replace(/\D/g, "");

        setSalvando(true);
        try {
            const atualizado = await update_my_profile(mudancas);
            set_perfil(atual => ({ ...(atual as PerfilUsuario), ...atualizado }));
            setRascunho({});
            setMensagem("Dados atualizados com sucesso.");
        } catch (err) {
            setErroGeral(err instanceof Error ? err.message : "Não foi possível atualizar seus dados.");
        } finally {
            setSalvando(false);
        }
    }

    function handle_toggle_password() {
        setMensagem(null);
        setSenhaAberta(aberta => !aberta);
        setSenhas(SENHA_VAZIA);
        setErrosSenha({});
        setErroSenhaGeral(null);
    }

    function handle_password_change(campo: CampoSenha) {
        return (valor: string) => {
            setSenhas(s => ({ ...s, [campo]: valor }));
            if (erros_senha[campo]) setErrosSenha(e => ({ ...e, [campo]: undefined }));
        };
    }

    async function handle_save_password(e: React.FormEvent) {
        e.preventDefault();
        if (salvando_senha) return;

        setErroSenhaGeral(null);

        const novos_erros = validate_password_change(senhas);
        setErrosSenha(novos_erros);
        if (Object.keys(novos_erros).length > 0) return;

        setSalvandoSenha(true);
        try {
            await update_my_profile({ senha: senhas.nova, senha_atual: senhas.atual });
            setSenhaAberta(false);
            setSenhas(SENHA_VAZIA);
            setMensagem("Senha alterada com sucesso.");
        } catch (err) {
            setErroSenhaGeral(err instanceof Error ? err.message : "Não foi possível alterar a senha.");
        } finally {
            setSalvandoSenha(false);
        }
    }

    function handle_open_deactivate() {
        setMensagem(null);
        setSenhaDesativar("");
        setErroDesativar(null);
        setDesativarAberto(true);
    }

    function handle_close_deactivate() {
        if (desativando) return;
        setDesativarAberto(false);
    }

    async function handle_deactivate() {
        if (desativando) return;

        if (!senha_desativar) {
            setErroDesativar("Informe sua senha para confirmar.");
            return;
        }

        setErroDesativar(null);
        setDesativando(true);
        try {
            await deactivate_my_account(senha_desativar);
            // Sai da página antes de limpar a sessão para a rota protegida não redirecionar ao login.
            navigate("/", { replace: true });
            logout();
        } catch (err) {
            setErroDesativar(err instanceof Error ? err.message : "Não foi possível desativar sua conta.");
            setDesativando(false);
        }
    }

        return (
        <>
            <NavBar />

            <main className={`perfil ${campos_alterados.length > 0 ? "perfil--com-barra" : ""}`}>
                <h2>Meu Perfil</h2>
                <p className="perfil-subtitulo">Consulte e atualize seus dados cadastrais.</p>

                {carregando && <p className="perfil-aviso" role="status">Carregando perfil...</p>}
                {erro && <p className="perfil-aviso perfil-aviso--erro" role="alert">{erro}</p>}

                {perfil && salvo && (
                    <div className="perfil-card">
                        <div className="perfil-avatar" aria-hidden="true">{get_initials(perfil.nome)}</div>

                        {mensagem && <p className="perfil-mensagem" role="status">{mensagem}</p>}

                        <form className="perfil-form" onSubmit={handle_save} noValidate aria-label="Dados cadastrais">
                            {CAMPOS.map(campo => (
                                <CampoTexto
                                    key={campo.chave}
                                    label={campo.label}
                                    variante={campo.variante}
                                    placeholder={campo.placeholder}
                                    value={rascunho[campo.chave] ?? salvo[campo.chave]}
                                    onChange={valor => handle_change(campo, valor)}
                                    erro={erros[campo.chave]}
                                    autoComplete={campo.autocomplete}
                                    disabled={salvando}
                                />
                            ))}

                            {erro_geral && <p className="perfil-erro-geral" role="alert">{erro_geral}</p>}
                        </form>

                        <section className="perfil-secao" aria-label="Senha">
                            {!senha_aberta && (
                                <Botao variant="secundario" className="botao-acoes" size="md" fullWidth onClick={handle_toggle_password}>
                                    Editar Senha
                                </Botao>
                            )}

                            {senha_aberta && (
                                <form className="perfil-senha-painel" onSubmit={handle_save_password} noValidate aria-label="Alterar senha">
                                    <CampoTexto
                                        label="Senha Atual"
                                        variante="senha"
                                        value={senhas.atual}
                                        onChange={handle_password_change("atual")}
                                        erro={erros_senha.atual}
                                        autoComplete="current-password"
                                        disabled={salvando_senha}
                                    />
                                    <CampoTexto
                                        label="Nova Senha"
                                        variante="senha"
                                        value={senhas.nova}
                                        onChange={handle_password_change("nova")}
                                        erro={erros_senha.nova}
                                        autoComplete="new-password"
                                        disabled={salvando_senha}
                                    />
                                    <CampoTexto
                                        label="Confirmar Nova Senha"
                                        variante="senha"
                                        value={senhas.confirmacao}
                                        onChange={handle_password_change("confirmacao")}
                                        erro={erros_senha.confirmacao}
                                        autoComplete="new-password"
                                        disabled={salvando_senha}
                                    />

                                    {erro_senha_geral && <p className="perfil-erro-geral" role="alert">{erro_senha_geral}</p>}

                                    <div className="perfil-acoes perfil-acoes--painel">
                                        <Botao variant="secundario" size="md" className="botao-acoes" fullWidth onClick={handle_toggle_password} disabled={salvando_senha}>
                                            Cancelar
                                        </Botao>
                                        <Botao variant="primario" size="md" className="botao-acoes" fullWidth type="submit" disabled={salvando_senha}>
                                            {salvando_senha ? "Salvando..." : "Atualizar Senha"}
                                        </Botao>
                                    </div>
                                </form>
                            )}
                        </section>

                        <section className="perfil-zona-risco" aria-labelledby="perfil-zona-risco-titulo">
                            <h3 id="perfil-zona-risco-titulo">Zona de Perigo</h3>

                            <div className="perfil-zona-risco-item">
                                <div>
                                    <strong>Desativar esta conta</strong>
                                    <p>Sua conta ficará inativa e você será desconectado.</p>
                                </div>
                                <Botao variant="secundario" size="md" className="perfil-botao-perigo" onClick={handle_open_deactivate}>
                                    Desativar Conta
                                </Botao>
                            </div>
                        </section>
                    </div>
                )}

                {perfil && salvo && campos_alterados.length > 0 && (
                    <div className="perfil-barra-alteracoes" role="region" aria-label="Alterações pendentes">
                        <span className="perfil-barra-texto">Você tem alterações não salvas.</span>
                        <div className="perfil-barra-botoes">
                            <Botao variant="secundario" className="botao-acoes" size="md" fullWidth onClick={handle_discard_all} disabled={salvando}>
                                Descartar
                            </Botao>
                            <Botao
                                variant="primario"
                                className="botao-acoes"
                                size="md"
                                fullWidth
                                onClick={() => void handle_save()}
                                disabled={salvando}
                            >
                                {salvando ? "Salvando..." : "Salvar Alterações"}
                            </Botao>
                        </div>
                    </div>
                )}
            </main>

            {desativar_aberto && (
                <ModalConfirmacao
                    title="Desativar sua conta?"
                    primary_label={desativando ? "Desativando..." : "Desativar Conta"}
                    on_primary={() => void handle_deactivate()}
                    secondary_label="Cancelar"
                    on_secondary={handle_close_deactivate}
                    on_dismiss={handle_close_deactivate}
                >
                    <p className="modal-confirmacao-destaque">Tem certeza que deseja desativar sua conta?</p>
                    <p>
                        Você será desconectado e não poderá mais acessar o NPET com esta conta.
                        Para reativá-la depois, será necessário falar com a equipe do NPET.
                    </p>
                    <p>Para continuar, confirme sua senha.</p>
                    <CampoTexto
                        label="Senha"
                        variante="senha"
                        value={senha_desativar}
                        onChange={valor => { setSenhaDesativar(valor); setErroDesativar(null); }}
                        erro={erro_desativar ?? undefined}
                        autoComplete="current-password"
                        disabled={desativando}
                    />
                </ModalConfirmacao>
            )}

            <Rodape />
        </>
    );
}