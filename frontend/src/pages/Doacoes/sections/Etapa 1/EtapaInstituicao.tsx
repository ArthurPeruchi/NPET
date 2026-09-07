import { useState, useMemo } from "react";
import SelecaoInstituicao from "./SelecaoInstituicao/SelecaoInstituicao";
import ListaInstituicoes from "./ListaInstituicoes/ListaInstituicoes";
import { INSTITUICOES } from "../../../../mocks/mockInstituicoes";
import ModalInstituicao from "../../../../components/ModalInstituicao/ModalInstituicao";
import type { Instituicao } from "../../../../types/domain";

type EtapaInstituicaoProps = {
    onAvancar: (inst: Instituicao) => void;
};

export default function EtapaInstituicao({ onAvancar }: EtapaInstituicaoProps) {
    const [termoBusca, setTermoBusca] = useState("");

    const [instSelecionada, setInstSelecionada] = useState<Instituicao | null>(null);

    const instituicoesFiltradas = useMemo(() =>
        INSTITUICOES.filter(inst =>
            inst.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
            inst.cidade.toLowerCase().includes(termoBusca.toLowerCase())
        ),
        [termoBusca]
    );

    function handleClickDoar(inst: Instituicao) {
        onAvancar(inst);
        return;
    }

    return (
        <>
            <SelecaoInstituicao
                termoBusca={termoBusca}
                setTermoBusca={setTermoBusca}
            />
            <ListaInstituicoes
                instituicoes={instituicoesFiltradas}
                onVerDetalhes={setInstSelecionada}
                onDoar={handleClickDoar}
            />

            {instSelecionada && (
                <ModalInstituicao
                    instituicao={instSelecionada}
                    onFechar={() => setInstSelecionada(null)}
                    onDoar={(inst) => {
                        setInstSelecionada(null);
                        onAvancar(inst);
                    }}
                />
            )}
        </>
    );
}