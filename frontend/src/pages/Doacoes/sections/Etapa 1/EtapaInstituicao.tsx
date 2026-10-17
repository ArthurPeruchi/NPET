import { useState, useMemo } from "react";
import SelecaoInstituicao from "./SelecaoInstituicao/SelecaoInstituicao";
import ListaInstituicoes from "./ListaInstituicoes/ListaInstituicoes";
import useInstituicoes from "../../../../hooks/useInstituicoes";
import ModalInstituicao from "../../../../components/ModalInstituicao/ModalInstituicao";
import type { Instituicao } from "../../../../types/domain";

type EtapaInstituicaoProps = {
    onAvancar: (inst: Instituicao) => void;
};

export default function EtapaInstituicao({ onAvancar }: EtapaInstituicaoProps) {
    const [termoBusca, setTermoBusca] = useState("");

    const [instSelecionada, setInstSelecionada] = useState<Instituicao | null>(null);

    const { instituicoes, carregando, erro } = useInstituicoes();

    const instituicoesFiltradas = useMemo(() =>
        instituicoes.filter(inst =>
            inst.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
            inst.cidade.toLowerCase().includes(termoBusca.toLowerCase())
        ),
        [instituicoes, termoBusca]
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
            {carregando && <p role="status">Carregando instituições...</p>}
            {erro && <p role="alert">{erro}</p>}
            {!carregando && !erro && (
                <ListaInstituicoes
                    instituicoes={instituicoesFiltradas}
                    onVerDetalhes={setInstSelecionada}
                    onDoar={handleClickDoar}
                />
            )}

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