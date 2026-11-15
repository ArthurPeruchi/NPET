import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Botao from "../../../../../components/Botao/Botao";
import { SIMULATED_PIX_KEY } from "../../../../../services/doacoesService";
import "./PopUpDoacao.css";

export type FasePopUp = "confirmar_cartao" | "processando" | "pix_gerado" | "concluida";

type PopUpDoacaoProps = {
    fase: FasePopUp;
    valor_formatado: string;
    onConfirm: () => void; // "Confirmar e Doar" (cartão)
    onCancel: () => void; // "Cancelar" / X antes de a doação ser registrada
    onFinish: () => void; // "Voltar ao Início" / X depois de a doação ser registrada
};

const TEMPO_FEEDBACK_COPIA_MS = 2000;

function IconeFechar() {
    return (
        <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
        </svg>
    );
}

function IconeCopiar() {
    return (
        <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z" />
        </svg>
    );
}

function IconeConfete() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#1a6e54" viewBox="0 0 256 256">
            <path d="M58.89,154.89l42.22,42.22-50.63,18.4a7.79,7.79,0,0,1-10-10Zm138.82-4.72L105.83,58.29A7.79,7.79,0,0,0,93,61.14l-14.9,41,75.82,75.82,41-14.9A7.79,7.79,0,0,0,197.71,150.17Z" opacity="0.2"></path><path d="M111.49,52.63a15.8,15.8,0,0,0-26,5.77L33,202.78A15.83,15.83,0,0,0,47.76,224a16,16,0,0,0,5.46-1l144.37-52.5a15.8,15.8,0,0,0,5.78-26Zm-8.33,135.21-35-35,13.16-36.21,58.05,58.05Zm-55,20,14-38.41,24.45,24.45ZM156,168.64,87.36,100l13-35.87,91.43,91.43ZM160,72a37.8,37.8,0,0,1,3.84-15.58C169.14,45.83,179.14,40,192,40c6.7,0,11-2.29,13.65-7.21A22,22,0,0,0,208,23.94,8,8,0,0,1,224,24c0,12.86-8.52,32-32,32-6.7,0-11,2.29-13.65,7.21A22,22,0,0,0,176,72.06,8,8,0,0,1,160,72ZM136,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm101.66,82.34a8,8,0,1,1-11.32,11.31l-16-16a8,8,0,0,1,11.32-11.32Zm4.87-42.75-24,8a8,8,0,0,1-5.06-15.18l24-8a8,8,0,0,1,5.06,15.18Z"></path>
        </svg>
    );
}

export default function PopUpDoacao({ fase, valor_formatado, onConfirm, onCancel, onFinish }: PopUpDoacaoProps) {
    const [chave_copiada, set_chave_copiada] = useState(false);
    const [erro_copia, set_erro_copia] = useState(false);
    const timer_ref = useRef<number | null>(null);
    const container_ref = useRef<HTMLDivElement>(null);

    const processando = fase === "processando";
    const antes_do_registro = fase === "confirmar_cartao";

    function handle_close() {
        if (processando) return;
        if (antes_do_registro) onCancel();
        else onFinish();
    }

    // Escape fecha (exceto enquanto processa) e o foco fica dentro do pop-up.
    useEffect(() => {
        function handle_key_down(e: KeyboardEvent) {
            if (e.key === "Escape") handle_close();
        }
        document.addEventListener("keydown", handle_key_down);
        return () => document.removeEventListener("keydown", handle_key_down);
    });

    useEffect(() => {
        container_ref.current?.focus();
    }, [fase]);

    // Trava o scroll da página enquanto o pop-up está aberto.
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    useEffect(() => {
        return () => {
            if (timer_ref.current !== null) window.clearTimeout(timer_ref.current);
        };
    }, []);

    async function handle_copy() {
        try {
            await navigator.clipboard.writeText(SIMULATED_PIX_KEY);
            set_erro_copia(false);
            set_chave_copiada(true);
            if (timer_ref.current !== null) window.clearTimeout(timer_ref.current);
            timer_ref.current = window.setTimeout(() => set_chave_copiada(false), TEMPO_FEEDBACK_COPIA_MS);
        } catch {
            // Clipboard indisponível (http, permissão negada): orienta a copiar manualmente.
            set_erro_copia(true);
        }
    }

    const titulo = fase === "concluida"
        ? <>Doação concluída! <IconeConfete /></>
        : fase === "processando"
            ? ""
            : <>Doação pronta para ser concluída! <IconeConfete /></>;

    const titulo_acessivel = fase === "concluida"
    ? "Doação concluída!"
    : fase === "processando"
        ? "Processando doação..."
        : "Doação pronta para ser concluída!";

    return (
        <div className="popup-overlay">
            <div
                ref={container_ref}
                className="popup-container"
                role="dialog"
                aria-modal="true"
                aria-label={processando ? "Processando doação" : titulo_acessivel}
                tabIndex={-1}
            >
                {processando ? (
                    <div className="popup-processando" role="status">
                        <p className="popup-processando-texto">Simulando doação...</p>
                        <span className="popup-spinner" aria-hidden="true" />
                    </div>
                ) : (
                    <>
                        <div className="popup-cabecalho">
                            <h3 className="popup-titulo">{titulo}</h3>
                            <button
                                type="button"
                                className="popup-fechar"
                                onClick={handle_close}
                                aria-label="Fechar"
                            >
                                <IconeFechar />
                            </button>
                        </div>

                        {fase === "pix_gerado" && (
                            <>
                                <p className="popup-texto">
                                    Estamos quase lá! Use o QR Code abaixo ou copie a chave para concluir sua doação.
                                </p>

                                <div className="popup-qrcode">
                                    <QRCodeSVG
                                        value={SIMULATED_PIX_KEY}
                                        size={160}
                                        title="QR Code para pagamento via PIX"
                                    />
                                </div>

                                <div className="popup-chave">
                                    <fieldset className="popup-chave-campo">
                                        <legend>Chave PIX</legend>
                                        <span>{SIMULATED_PIX_KEY}</span>
                                    </fieldset>
                                    <button type="button" className="popup-copiar" onClick={handle_copy}>
                                        <IconeCopiar />
                                        {chave_copiada ? "Copiado!" : "Copiar"}
                                    </button>
                                </div>

                                {erro_copia && (
                                    <p className="popup-erro" role="alert">
                                        Não foi possível copiar automaticamente. Selecione e copie a chave acima.
                                    </p>
                                )}

                                <p className="popup-texto">
                                    Assim que o pagamento for identificado, você receberá uma confirmação por e-mail.
                                </p>

                                <Botao variant="secundario" size="md" className="botao-acoes" fullWidth onClick={onFinish}>
                                    Voltar ao Início
                                </Botao>
                            </>
                        )}

                        {fase === "confirmar_cartao" && (
                            <>
                                <p className="popup-texto">
                                    Sua doação de <strong>{valor_formatado}</strong> será processada agora. Deseja continuar?
                                </p>

                                <div className="popup-acoes">
                                    <Botao variant="primario" size="md" className="btn-acoes" fullWidth onClick={onConfirm}>
                                        Confirmar e Doar {valor_formatado}
                                    </Botao>
                                    <Botao variant="secundario" size="md" className="btn-acoes" fullWidth onClick={onCancel}>
                                        Cancelar
                                    </Botao>
                                </div>

                                <p className="popup-texto">
                                    Assim que o pagamento for identificado, você receberá uma confirmação por e-mail.
                                </p>
                            </>
                        )}

                        {fase === "concluida" && (
                            <>
                                <p className="popup-texto">
                                    Sua doação de <strong>{valor_formatado}</strong> foi processada com sucesso. Obrigado por
                                    transformar a vida dos animais!
                                </p>
                                <p className="popup-texto">
                                    Você receberá uma confirmação por e-mail.
                                </p>

                                <Botao variant="primario" size="md" className="btn-acoes" fullWidth onClick={onFinish}>
                                    Voltar ao Início
                                </Botao>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
