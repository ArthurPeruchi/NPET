import SelecaoMetodo from "./SelecaoMetodo/SelecaoMetodo";
import type { TipoDoacao } from "../../../../types/domain";

type EtapaMetodoProps = {
    onAvancar: (tipo: TipoDoacao) => void;
}

export default function EtapaMetodo({ onAvancar }: EtapaMetodoProps) {

    return (
        <SelecaoMetodo
            onAvancar={onAvancar}
        />
    )
}