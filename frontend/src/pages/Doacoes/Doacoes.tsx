import NavBar from "../../components/NavBar/NavBar";
import BarraProgresso from "../../components/BarraProgresso/BarraProgresso";
import EtapaInstituicao from "./sections/Etapa 1/EtapaInstituicao";
import Rodape from "../../components/Rodape/Rodape";

import { useState } from "react";

export default function Doacoes() {
    const [passoAtual, setPassoAtual] = useState<1 | 2 | 3 | 4>(1);

    return (
        <>
            <NavBar />
            <BarraProgresso passoAtual={passoAtual} onPassoClick={(passo) => setPassoAtual(passo)} />

            {passoAtual === 1 && (
                <EtapaInstituicao
                    onAvancar={() => setPassoAtual(2)}
                />
            )}
            {/* passoAtual === 2 && <EtapaMetodo ... /> */}
            {/* passoAtual === 3 && <EtapaDetalhes ... /> */}
            {/* passoAtual === 4 && <EtapaConfirmacao ... /> */}

            <Rodape />
        </>
    );
}