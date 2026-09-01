import InstituicaoCard from "../../../../../components/InstituicaoCard/InstituicaoCard";
import "./ListaInstituicoes.css";
import type { Instituicao } from "../../../../../types/domain";

type ListaInstituicoesProps = {
    instituicoes: Instituicao[];
    onDoar: () => void;
};

export default function ListaInstituicoes({ instituicoes, onDoar }: ListaInstituicoesProps) {
    
    function handleClickDetalhes(instituicao: Instituicao) {
        // console.log(`Visualizando detalhes da instituição: ${instituicao.nome}`);
        return;
    }
    
    if (instituicoes.length === 0) {
        return (
            <div className="lista-instituicoes lista-instituicoes--vazia">
                <p>Nenhuma instituição encontrada.</p>
            </div>
        );
    }

    return (
        <div className="lista-instituicoes">
            {instituicoes.filter(inst => inst.nome !== "UniEVANGÉLICA - Universidade Evangélica de Goiás").map(inst => (
                <InstituicaoCard
                    key={inst.id}
                    instituicao={inst}
                    onVerDetalhes={() => handleClickDetalhes(inst)}
                    onDoar={onDoar}
                />
            ))}
        </div>
    );
}