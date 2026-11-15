import type { ReactNode } from "react";
import CampoTexto from "../../../components/CampoTexto/CampoTexto";
import Botao from "../../../components/Botao/Botao";
import { IconePix, IconeCartaoCredito } from "../../../components/IconePagamento/IconePagamento";
import { format_date, get_next_monthly_date } from "../../../utils/datas";
import { format_currency } from "../../../utils/moeda";
import type { DoacaoRegistrada, FormaPagamento, Instituicao, ItemDoacaoProduto, StatusDoacao } from "../../../types/domain";
import { ROTULO_FORMA_PAGAMENTO, ROTULO_STATUS } from "./../rotulos";
import "./CardDoacao.css";

type CardDoacaoProps = {
    donation: DoacaoRegistrada;
    institution?: Instituicao;
    on_view_feedback: () => void;
    on_repeat: () => void;
    on_toggle_recurrence: () => void;
};

const ICONE_CHECK = (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 8l3.5 3.5 6.5-7" stroke="var(--main-color)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ICONE_RELOGIO = (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke="#777777" strokeWidth="1.4" strokeDasharray="2.5 2" />
        <path d="M8 4.5V8l2.2 1.4" stroke="#777777" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
);

const ICONE_X = (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4 4l8 8M12 4l-8 8" stroke="#e55959" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
);

const ICONE_STATUS: Record<StatusDoacao, ReactNode> = {
    confirmada: ICONE_CHECK,
    pendente: ICONE_RELOGIO,
    cancelada: ICONE_X,
};

const ICONE_FORMA_PAGAMENTO: Record<FormaPagamento, ReactNode> = {
    pix: <IconePix />,
    cartao_credito: <IconeCartaoCredito />,
};

const ICONE_SINO_PROPS = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
};

const ICONE_SINO_PARADO = (
    <svg {...ICONE_SINO_PROPS}>
        <path d="M12 3a6 6 0 0 0-6 6c0 4-1.5 6-2.5 7h17c-1-1-2.5-3-2.5-7a6 6 0 0 0-6-6z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
);

const ICONE_SINO_TOCANDO = (
    <svg {...ICONE_SINO_PROPS}>
        <path d="M12 3a6 6 0 0 0-6 6c0 4-1.5 6-2.5 7h17c-1-1-2.5-3-2.5-7a6 6 0 0 0-6-6z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
        <path d="M3 8.5A9 9 0 0 1 5.2 5M21 8.5A9 9 0 0 0 18.8 5" />
    </svg>
);

// TODO: Ajustar quando o item ganhar mais detalhes (marca, espécie, fase de vida, peso...).
function ItemProdutoLinha({ item }: { item: ItemDoacaoProduto }) {
    const tem_unidade = item.unidade && item.unidade !== "unidade";
    const quantidade = tem_unidade ? `${item.quantidade} ${item.unidade}` : `${item.quantidade}x`;

    return (
        <li>
            [{quantidade}] {item.nome}
            {item.descricao && <small className="card-doacao-item-descricao">{item.descricao}</small>}
        </li>
    );
}

export default function CardDoacao({
    donation,
    institution,
    on_view_feedback,
    on_repeat,
    on_toggle_recurrence,
}: CardDoacaoProps) {
    const nome_instituicao = institution?.nome ?? `Instituição #${donation.idInstituicao}`;
    const tem_feedback = Boolean(donation.feedback);
    const tem_feedback_novo = tem_feedback && !donation.feedbackVisto;
    const pode_repetir = institution?.aceitaDoacoes === true;

    return (
        <article className="card-doacao" aria-label={`Doação para ${nome_instituicao}`}>
            {tem_feedback_novo && (
                <button
                    type="button"
                    className="card-doacao-sino"
                    onClick={on_view_feedback}
                    aria-label="Novo feedback recebido. Abrir feedback da doação"
                    title="Novo feedback recebido"
                >
                    <span className="sino-icone sino-icone--parado">{ICONE_SINO_PARADO}</span>
                    <span className="sino-icone sino-icone--tocando">{ICONE_SINO_TOCANDO}</span>
                </button>
            )}

            <header className="card-doacao-cabecalho">
                {institution?.logo
                    ? <img className="card-doacao-logo" src={institution.logo} alt={`Logo de ${nome_instituicao}`} />
                    : <div className="card-doacao-logo-placeholder" aria-hidden="true" />}
                <h3 className="card-doacao-nome">{nome_instituicao}</h3>
            </header>

            <div className="card-doacao-campos">
                <CampoTexto label="Status" variante="exibicao" icone={ICONE_STATUS[donation.status]} value={ROTULO_STATUS[donation.status]} />

                {donation.tipoDoacao === "monetaria" ? (
                    <>
                        <CampoTexto label="Data da Transação" variante="exibicao" value={format_date(donation.criadaEm)} />
                        <CampoTexto label="Valor" variante="exibicao" value={format_currency(donation.valor)} />
                        <CampoTexto
                            label="Forma de Pagamento"
                            variante="exibicao"
                            icone={ICONE_FORMA_PAGAMENTO[donation.formaPagamento]}
                            value={ROTULO_FORMA_PAGAMENTO[donation.formaPagamento]}
                        />

                        <div className="card-doacao-recorrencia">
                            <CampoTexto
                                label="Recorrência Mensal?"
                                variante="exibicao"
                                icone={donation.recorrente ? ICONE_CHECK : ICONE_X}
                                value={donation.recorrente
                                    ? `Próximo lembrete: ${format_date(get_next_monthly_date(donation.criadaEm))}`
                                    : "Não"}
                            />
                            {/* Só doações concluídas podem ganhar recorrência; desativar vale sempre. */}
                            {(donation.recorrente || donation.status === "confirmada") && (
                                <Botao variant="primario" size="md" className="botao-acoes" onClick={on_toggle_recurrence}>
                                    {donation.recorrente ? "Desativar" : "Ativar"}
                                </Botao>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {donation.formaEntrega === "visita" ? (
                            <CampoTexto
                                label="Data da Entrega"
                                variante="exibicao"
                                value={`${donation.visita.data} às ${donation.visita.horario}`}
                            />
                        ) : (
                            <CampoTexto label="Data da Transação" variante="exibicao" value={format_date(donation.criadaEm)} />
                        )}

                        <div className="campo-texto campo-texto--exibicao card-doacao-largura-total">
                            <fieldset className="campo-texto-fieldset">
                                <legend className="campo-texto-legend">Produto(s) Doado(s)</legend>
                                <ul className="card-doacao-itens">
                                    {donation.itens.map(item => <ItemProdutoLinha key={item.id} item={item} />)}
                                </ul>
                            </fieldset>
                        </div>
                    </>
                )}
            </div>

            <div className="card-doacao-acoes">
                <Botao variant="primario" size="md" className="botao-acoes" fullWidth disabled={!tem_feedback} onClick={on_view_feedback}>
                    Ver Feedback da Doação
                </Botao>
                <Botao variant="secundario" size="md" className="botao-acoes" fullWidth disabled={!pode_repetir} onClick={on_repeat}>
                    Repetir Doação
                </Botao>
            </div>
        </article>
    );
}