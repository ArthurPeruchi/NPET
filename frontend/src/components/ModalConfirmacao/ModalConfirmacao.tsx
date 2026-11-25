import { useEffect, useId, type ReactNode } from "react";
import Botao from "../Botao/Botao";
import "./ModalConfirmacao.css";

type ModalConfirmacaoProps = {
    title: string;
    children: ReactNode;
    primary_label: string; // botão da direita (ação principal)
    on_primary: () => void;
    secondary_label?: string; // botão da esquerda; sem ele, só o principal é exibido
    on_secondary?: () => void;
    on_dismiss: () => void; // X, Escape e clique fora do pop-up
};

function IconeFechar() {
    return (
        <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
        </svg>
    );
}

export default function ModalConfirmacao({
    title,
    children,
    primary_label,
    on_primary,
    secondary_label,
    on_secondary,
    on_dismiss,
}: ModalConfirmacaoProps) {
    const title_id = useId();

    useEffect(() => {
        function handle_key_down(e: KeyboardEvent) {
            if (e.key === "Escape") on_dismiss();
        }
        document.addEventListener("keydown", handle_key_down);
        return () => document.removeEventListener("keydown", handle_key_down);
    }, [on_dismiss]);

    // Trava o scroll da página enquanto o pop-up está aberto.
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const tem_secundario = Boolean(secondary_label && on_secondary);

    return (
        <div className="modal-confirmacao-overlay" onClick={on_dismiss}>
            <div
                className="modal-confirmacao"
                role="dialog"
                aria-modal="true"
                aria-labelledby={title_id}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-confirmacao-cabecalho">
                    <h3 id={title_id} className="modal-confirmacao-titulo">{title}</h3>
                    <button
                        type="button"
                        className="modal-confirmacao-fechar"
                        onClick={on_dismiss}
                        aria-label="Fechar"
                    >
                        <IconeFechar />
                    </button>
                </div>

                <div className="modal-confirmacao-corpo">{children}</div>

                <div className={`modal-confirmacao-acoes ${tem_secundario ? "" : "modal-confirmacao-acoes--unica"}`}>
                    {tem_secundario && (
                        <Botao variant="secundario" size="sm" fullWidth onClick={on_secondary}>
                            {secondary_label}
                        </Botao>
                    )}
                    <Botao variant="primario" size="sm" fullWidth onClick={on_primary}>
                        {primary_label}
                    </Botao>
                </div>
            </div>
        </div>
    );
}