import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CampoTexto from "../../../../components/CampoTexto/CampoTexto";
import Botao from "../../../../components/Botao/Botao";
import ModalConfirmacao from "../../../../components/ModalConfirmacao/ModalConfirmacao";
import PopUpDoacao, { type FasePopUp } from "./PopUpDoacao/PopUpDoacao";
import { register_donation } from "../../../../services/doacoesService";
import type { DadosDoacaoMonetaria, Instituicao } from "../../../../types/domain";
import "./EtapaConfirmacao.css";
import { IconePix, IconeCartaoCredito } from "../../../../components/IconePagamento/IconePagamento";
import { format_currency } from "../../../../utils/moeda";

type EtapaConfirmacaoProps = {
    dados: DadosDoacaoMonetaria;
    instituicao: Instituicao;
};

type FaseConfirmacao = "formulario" | FasePopUp;

const ROTULO_FORMA_PAGAMENTO = {
    pix: "PIX",
    cartao_credito: "Cartão de Crédito",
} as const;

const IconeInformacao = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#1a6e54" viewBox="0 0 256 256">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"></path>
    </svg>
)

export default function EtapaConfirmacao({ dados, instituicao }: EtapaConfirmacaoProps) {
    const navigate = useNavigate();

    const [recorrente, setRecorrente] = useState<boolean>(dados.recorrente ?? false);
    const [aceitouTermos, setAceitouTermos] = useState<boolean>(false);
    const [fase, setFase] = useState<FaseConfirmacao>("formulario");
    const [dialogoRecorrencia, setDialogoRecorrencia] = useState<boolean>(false);
    const [erro, setErro] = useState<string | null>(null);

    const formaPagamento = dados.formaPagamento;
    const valor = dados.valor ?? 0;
    const valor_formatado = format_currency(valor);
    const Cartao = formaPagamento === "cartao_credito";

    async function processDonation() {
        if (!formaPagamento || dados.idInstituicao === null) return;

        setErro(null);
        setFase("processando");

        try {
            await register_donation({
                idInstituicao: dados.idInstituicao,
                valor,
                formaPagamento: formaPagamento,
                recorrente,
                cartaoFinal: dados.cartaoFinal,
            });
            setFase(Cartao ? "concluida" : "pix_gerado");  
        } catch (e) {
            setErro(e instanceof Error ? e.message : "Não foi possível registrar sua doação.");
            setFase("formulario");
        }
    }

    function handleRecurrenceChange(checked: boolean) {
        if (checked) setDialogoRecorrencia(true);
        else setRecorrente(false);
    }

    function confirmRecurrence() {
        setRecorrente(true);
        setDialogoRecorrencia(false);
    }

    // Cartão pede uma última confirmação; PIX já gera a cobrança.
    function handleConfirmClick() {
        if (Cartao) setFase("confirmar_cartao");
        else void processDonation();
    }

    return (
        <div className="confirmacao">
            <h2>Tudo pronto para confirmar sua doação?</h2>
            <p className="subtitulo">Revise as informações e conclua seu gesto de solidariedade.</p>

            <div className="confirmacao-campos">
                <CampoTexto
                    label="Instituição Beneficiada"
                    variante="exibicao"
                    className={`confirmacao-instituicao ${!instituicao.logo ? "sem-logo" : ""}`}
                    value={instituicao.nome}
                    icone={instituicao.logo
                        ? <img src={instituicao.logo} alt={`Logo de ${instituicao.nome}`} />
                        : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#1a6e54" viewBox="0 0 256 256"><path d="M232,224H208V32h8a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16h8V224H24a8,8,0,0,0,0,16H232a8,8,0,0,0,0-16ZM64,32H192V224H160V184a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v40H64Zm80,192H112V192h32ZM88,64a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H96A8,8,0,0,1,88,64Zm48,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H144A8,8,0,0,1,136,64ZM88,104a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H96A8,8,0,0,1,88,104Zm48,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H144A8,8,0,0,1,136,104ZM88,144a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H96A8,8,0,0,1,88,144Zm48,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H144A8,8,0,0,1,136,144Z"></path></svg>}
                    />
                
                <CampoTexto
                    label="Tipo de Doação"
                    variante="exibicao"
                    value="Monetária"
                />

                <CampoTexto
                    label="Valor"
                    variante="exibicao"
                    value={valor_formatado}
                />

                <CampoTexto
                    label="Forma de Pagamento"
                    variante="exibicao"
                    className={Cartao ? "" : "confirmacao-largura-total"}
                    value={formaPagamento ? ROTULO_FORMA_PAGAMENTO[formaPagamento] : ""}
                    icone={Cartao ? <IconeCartaoCredito /> : <IconePix />}
                />

                {Cartao && (
                    <CampoTexto
                        label="Cartão Utilizado"
                        variante="exibicao"
                        value={dados.cartaoFinal ? `Cartão com final ${dados.cartaoFinal}` : ""}
                    />
                )}
            </div>

            <div className="confirmacao-opcoes">
                <div className="confirmacao-recorrente">
                    <label className="confirmacao-checkbox">
                        <input
                            type="checkbox"
                            checked={recorrente}
                            onChange={e => handleRecurrenceChange(e.target.checked)}
                        />
                        Tornar essa doação recorrente
                    </label>

                    <button
                        type="button"
                        className="confirmacao-info"
                        onClick={() => setDialogoRecorrencia(true)}
                        aria-label="O que é uma doação recorrente?"
                    >
                        <IconeInformacao />
                    </button>
                </div>
                <label className="confirmacao-checkbox">
                    <input
                        type="checkbox"
                        checked={aceitouTermos}
                        onChange={e => setAceitouTermos(e.target.checked)}
                    />
                    <span>
                        Concordo com os{" "}
                        {/* TODO: Página de Termos ainda não existe */}
                        <a href="/termos" target="_blank" rel="noopener noreferrer">Termos e Condições do NPET</a>
                    </span>
                </label>
            </div>

            {erro && <p className="confirmacao-erro" role="alert">{erro}</p>}

            <Botao
                variant="primario"
                size="md"
                className="confirmacao-botao"
                onClick={handleConfirmClick}
                disabled={!aceitouTermos || !formaPagamento || valor <= 0}
            >
                Confirmar Doação
            </Botao>

            {fase !== "formulario" && (
                <PopUpDoacao
                    fase={fase}
                    valor_formatado={valor_formatado}
                    onConfirm={() => void processDonation()}
                    onCancel={() => setFase("formulario")}
                    onFinish={() => navigate("/")}
                />
            )}

            {dialogoRecorrencia && (
                <ModalConfirmacao
                    title={recorrente ? "Doação Recorrente" : "Tornar doação recorrente?"}
                    primary_label={recorrente ? "Entendi" : "Tornar recorrente"}
                    on_primary={recorrente ? () => setDialogoRecorrencia(false) : confirmRecurrence}
                    secondary_label={recorrente ? undefined : "Cancelar"}
                    on_secondary={() => setDialogoRecorrencia(false)}
                    on_dismiss={() => setDialogoRecorrencia(false)}
                >
                    {recorrente ? (
                        <p>
                            Todo mês enviaremos um lembrete para você confirmar a doação de <strong>{valor_formatado}</strong> à instituição <strong>{instituicao.nome}</strong>.
                        </p>
                    ) : (
                        <p>
                            Caso essa opção esteja ativa, todo mês enviaremos um lembrete para você confirmar a doação
                            de <strong>{valor_formatado}</strong> à instituição <strong>{instituicao.nome}</strong>.
                        </p>
                    )}
                    <p>Você pode alterar essa opção a qualquer momento no histórico de doações.</p>
                </ModalConfirmacao>
            )}
        </div>
    );
}