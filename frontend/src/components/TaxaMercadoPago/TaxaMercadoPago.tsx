import { useState } from "react";
import ModalConfirmacao from "../ModalConfirmacao/ModalConfirmacao";
import type { FormaPagamento } from "../../types/domain";
import { format_currency } from "../../utils/moeda";
import { GATEWAY_FEE_RATE, calculate_gateway_fee, format_rate } from "../../utils/taxas";
import "./TaxaMercadoPago.css";

type TaxaMercadoPagoProps = {
    valor: number; // valor da doação, em reais
    forma_pagamento: FormaPagamento;
};

const NOME_FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
    pix: "PIX",
    cartao_credito: "cartão de crédito",
};

function IconeInformacao() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#1a6e54" viewBox="0 0 256 256" aria-hidden="true">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z" />
        </svg>
    );
}

// Mostra a taxa estimada que o Mercado Pago retém da doação e explica o que ela é.
export default function TaxaMercadoPago({ valor, forma_pagamento }: TaxaMercadoPagoProps) {
    const [explicacao_aberta, setExplicacaoAberta] = useState(false);

    const taxa = calculate_gateway_fee(valor, forma_pagamento);
    const percentual = format_rate(GATEWAY_FEE_RATE[forma_pagamento]);

    // O wrapper impede que cliques aqui cheguem ao campo que contém este componente e tirem o foco do pop-up.
    return (
        <span className="taxa-mp" onClick={e => e.stopPropagation()}>
            <span className="taxa-mp-texto" title={`Taxa estimada do Mercado Pago (${percentual})`}>
                Taxa: <strong>{format_currency(taxa)}</strong>
            </span>
            <button
                type="button"
                className="taxa-mp-info"
                onClick={() => setExplicacaoAberta(true)}
                aria-label={`Taxa estimada do Mercado Pago: ${format_currency(taxa)}. O que é essa taxa?`}
            >
                <IconeInformacao />
            </button>

            {explicacao_aberta && (
                <ModalConfirmacao
                    title="Taxa do Mercado Pago"
                    primary_label="Entendi"
                    on_primary={() => setExplicacaoAberta(false)}
                    on_dismiss={() => setExplicacaoAberta(false)}
                >
                    <p>
                        Para processar o pagamento com segurança, o Mercado Pago cobra uma taxa sobre cada doação.
                        Ela é descontada pelo próprio Mercado Pago do valor doado: você paga exatamente{" "}
                        <strong>{format_currency(valor)}</strong>, sem nenhum acréscimo.
                    </p>
                    <p>
                        Para esta doação no {NOME_FORMA_PAGAMENTO[forma_pagamento]}, a taxa estimada é de{" "}
                        <strong>{format_currency(taxa)}</strong> ({percentual}), e restam cerca de{" "}
                        <strong>{format_currency(valor - taxa)}</strong> depois dela.
                    </p>
                    <p>O valor exato pode variar conforme as condições da conta do Mercado Pago no momento do pagamento.</p>
                </ModalConfirmacao>
            )}
        </span>
    );
}