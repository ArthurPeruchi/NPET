import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../../components/NavBar/NavBar";
import Rodape from "../../components/Rodape/Rodape";
import BarraBusca from "../../components/BarraBusca/BarraBusca";
import Botao from "../../components/Botao/Botao";
import ModalConfirmacao from "../../components/ModalConfirmacao/ModalConfirmacao";
import CardDoacao from "./CardDoacao/CardDoacao";
import useHistoricoDoacoes from "../../hooks/useHistoricoDoacoes";
import useInstituicoes from "../../hooks/useInstituicoes";
import { format_date } from "../../utils/datas";
import { format_currency } from "../../utils/moeda";
import type { DoacaoRegistrada, Instituicao } from "../../types/domain";
import { ROTULO_FORMA_PAGAMENTO, ROTULO_STATUS } from "./rotulos";
import "./Historico.css";

const ICONE_BUSCA = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#ffffff" viewBox="0 0 256 256">
        <path d="M232.49,215.51,185,168a92.12,92.12,0,1,0-17,17l47.53,47.54a12,12,0,0,0,17-17ZM44,112a68,68,0,1,1,68,68A68.07,68.07,0,0,1,44,112Z" />
    </svg>
);

// Remove acentos e caixa para a busca não depender de como o usuário digita.
function normalize_text(text: string): string {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function get_search_text(donation: DoacaoRegistrada, institution_name: string): string {
    const parts = [institution_name, ROTULO_STATUS[donation.status], format_date(donation.criadaEm)];

    if (donation.tipoDoacao === "monetaria") {
        parts.push("monetaria", ROTULO_FORMA_PAGAMENTO[donation.formaPagamento], String(donation.valor));
    } else {
        parts.push("produto", ...donation.itens.map(item => item.nome));
    }

    return normalize_text(parts.join(" "));
}

export default function Historico() {
    const navigate = useNavigate();
    const { doacoes, carregando, erro, set_recurrence, see_feedback } = useHistoricoDoacoes();
    const { instituicoes } = useInstituicoes();

    const [termo_busca, setTermoBusca] = useState("");
    const [feedback_alvo, setFeedbackAlvo] = useState<DoacaoRegistrada | null>(null);
    const [recorrencia_alvo, setRecorrenciaAlvo] = useState<{ donation: DoacaoRegistrada; ativar: boolean } | null>(null);
    const [erro_acao, setErroAcao] = useState<string | null>(null);

    const instituicao_por_id = useMemo(
        () => new Map<number, Instituicao>(instituicoes.map(i => [i.id, i])),
        [instituicoes]
    );

    const doacoes_filtradas = useMemo(() => {
        const termo = normalize_text(termo_busca.trim());
        if (!termo) return doacoes;

        return doacoes.filter(d =>
            get_search_text(d, instituicao_por_id.get(d.idInstituicao)?.nome ?? "").includes(termo)
        );
    }, [doacoes, termo_busca, instituicao_por_id]);

    // Reabre o fluxo de doação com a instituição (e, na monetária, valor e forma) já preenchidos.
    function handle_repeat(donation: DoacaoRegistrada) {
        const institution = instituicao_por_id.get(donation.idInstituicao);
        if (!institution) return;

        navigate("/doacoes", {
            state: {
                instituicaoPreSelecionada: institution,
                repetirDoacao: donation.tipoDoacao === "monetaria"
                    ? {
                        tipoDoacao: "monetaria",
                        idInstituicao: institution.id,
                        valor: donation.valor,
                        formaPagamento: donation.formaPagamento,
                    }
                    : undefined,
            },
        });
    }

    function handle_view_feedback(donation: DoacaoRegistrada) {
        setFeedbackAlvo(donation);
        if (!donation.feedbackVisto) void see_feedback(donation.id).catch(() => undefined);
    }

    function handle_toggle_recurrence(donation: DoacaoRegistrada) {
        const ativar = donation.tipoDoacao === "monetaria" && !donation.recorrente;
        setRecorrenciaAlvo({ donation, ativar });
    }

    async function confirm_change_recurrence() {
        if (!recorrencia_alvo) return;

        const { donation, ativar } = recorrencia_alvo;
        setRecorrenciaAlvo(null);
        setErroAcao(null);

        try {
            await set_recurrence(donation.id, ativar);
        } catch (e) {
            setErroAcao(e instanceof Error ? e.message : "Não foi possível alterar a recorrência.");
        }
    }

    const nome_recorrencia = recorrencia_alvo
        ? instituicao_por_id.get(recorrencia_alvo.donation.idInstituicao)?.nome ?? "a instituição"
        : "";

    const valor_recorrencia = recorrencia_alvo?.donation.tipoDoacao === "monetaria"
        ? format_currency(recorrencia_alvo.donation.valor)
        : "";

    return (
        <>
            <NavBar />

            <main className="historico">
                <h2>Histórico de Doações</h2>
                <p className="historico-subtitulo">
                    Acompanhe o impacto das suas doações e veja como você tem feito a diferença.
                </p>

                <BarraBusca
                    placeholder="Buscar Doação..."
                    icon={ICONE_BUSCA}
                    value={termo_busca}
                    onChange={setTermoBusca}
                />

                {erro_acao && <p className="historico-aviso historico-aviso--erro" role="alert">{erro_acao}</p>}
                {carregando && <p className="historico-aviso" role="status">Carregando histórico...</p>}
                {erro && <p className="historico-aviso historico-aviso--erro" role="alert">{erro}</p>}

                {!carregando && !erro && doacoes.length === 0 && (
                    <div className="historico-vazio">
                        <p>Você ainda não fez nenhuma doação.</p>
                        <Botao variant="primario" size="md" to="/doacoes">Fazer uma doação</Botao>
                    </div>
                )}

                {!carregando && !erro && doacoes.length > 0 && doacoes_filtradas.length === 0 && (
                    <p className="historico-aviso">Nenhuma doação encontrada para essa busca.</p>
                )}

                {doacoes_filtradas.length > 0 && (
                    <section className="historico-lista" aria-label="Suas doações">
                        {doacoes_filtradas.map(donation => (
                            <CardDoacao
                                key={donation.id}
                                donation={donation}
                                institution={instituicao_por_id.get(donation.idInstituicao)}
                                on_view_feedback={() => handle_view_feedback(donation)}
                                on_repeat={() => handle_repeat(donation)}
                                on_toggle_recurrence={() => handle_toggle_recurrence(donation)}
                            />
                        ))}
                    </section>
                )}
            </main>

            {feedback_alvo && (
                <ModalConfirmacao
                    title="Feedback da Doação"
                    primary_label="Voltar"
                    on_primary={() => setFeedbackAlvo(null)}
                    on_dismiss={() => setFeedbackAlvo(null)}
                >
                    <p>{feedback_alvo.feedback}</p>
                </ModalConfirmacao>
            )}

            {recorrencia_alvo && (
                <ModalConfirmacao
                    title={recorrencia_alvo.ativar ? "Ativar recorrência?" : "Desativar recorrência?"}
                    primary_label={recorrencia_alvo.ativar ? "Ativar" : "Desativar"}
                    on_primary={() => void confirm_change_recurrence()}
                    secondary_label="Cancelar"
                    on_secondary={() => setRecorrenciaAlvo(null)}
                    on_dismiss={() => setRecorrenciaAlvo(null)}
                >
                    {recorrencia_alvo.ativar ? (
                        <>
                            <p className="modal-confirmacao-destaque">Deseja receber lembretes mensais?</p>
                            <p>
                                Todo mês você receberá um lembrete para realizar uma nova doação de{" "}
                                <strong>{valor_recorrencia}</strong> à instituição <strong>{nome_recorrencia}</strong>.
                            </p>
                            <p>Você pode desativar essa opção a qualquer momento.</p>
                        </>
                    ) : (
                        <>
                            <p className="modal-confirmacao-destaque">Tem certeza que deseja desativar?</p>
                            <p>
                                Você deixará de receber lembretes mensais para realizar uma nova doação à{" "}
                                <strong>{nome_recorrencia}</strong>.
                            </p>
                        </>
                    )}
                </ModalConfirmacao>
            )}

            <Rodape />
        </>
    );
}