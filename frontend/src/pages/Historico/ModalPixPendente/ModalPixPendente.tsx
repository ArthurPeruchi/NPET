import PopUpDoacao, { type FasePopUp } from "../../Doacoes/sections/Etapa 4/PopUpDoacao/PopUpDoacao";
import useAcompanharPagamento from "../../../hooks/useAcompanharPagamento";
import type { DoacaoMonetaria } from "../../../types/domain";
import { format_currency } from "../../../utils/moeda";

type ModalPixPendenteProps = {
    donation: DoacaoMonetaria;
    on_close: () => void;
    on_retry: () => void; // "Tentar Novamente" quando o código expirou
};

// Reabre o QR Code e o PIX Copia e Cola de uma doação que ainda aguarda pagamento.
export default function ModalPixPendente({ donation, on_close, on_retry }: ModalPixPendenteProps) {
    const status = useAcompanharPagamento(donation.id, true);

    const fase: FasePopUp =
        status === "confirmada" ? "concluida"
        : status === "cancelada" ? "pix_expirado"
        : "pix_gerado";

    return (
        <PopUpDoacao
            fase={fase}
            pix={donation.pix}
            valor_formatado={format_currency(donation.valor)}
            onConfirm={on_close}
            onCancel={on_retry}
            onFinish={on_close}
            rotulo_saida="Fechar"
        />
    );
}