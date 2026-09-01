import { useState, useMemo } from "react";
import SelecaoInstituicao from "./SelecaoInstituicao/SelecaoInstituicao";
import ListaInstituicoes from "./ListaInstituicoes/ListaInstituicoes";
import { INSTITUICOES } from "../../../../mocks/mockInstituicoes";

type EtapaInstituicaoProps = {
    onAvancar: () => void;
};

export default function EtapaInstituicao({ onAvancar }: EtapaInstituicaoProps) {
    const [termoBusca, setTermoBusca] = useState("");

    const instituicoesFiltradas = useMemo(() =>
        INSTITUICOES.filter(inst =>
            inst.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
            inst.cidade.toLowerCase().includes(termoBusca.toLowerCase())
        ),
        [termoBusca]
    );

    function handleClickDoar(){
        // alert("Você selecionou uma instituição para doar!"); // Exibe um alerta de confirmação
        onAvancar(); // Avança para a próxima etapa
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
                onDoar={handleClickDoar}
            />
        </>
    );
}