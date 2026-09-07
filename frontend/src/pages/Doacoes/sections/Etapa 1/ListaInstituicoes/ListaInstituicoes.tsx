import InstituicaoCard from "../../../../../components/InstituicaoCard/InstituicaoCard";
import "./ListaInstituicoes.css";
import type { Instituicao } from "../../../../../types/domain";

type ListaInstituicoesProps = {
    instituicoes: Instituicao[];
    onVerDetalhes: (inst: Instituicao) => void;
    onDoar: (inst: Instituicao) => void;
};

export default function ListaInstituicoes({ 
    instituicoes, 
    onVerDetalhes, 
    onDoar 
}: ListaInstituicoesProps) {

    const instituicoesParaDoar = instituicoes.filter(inst => inst.aceitaDoacoes);
    
    if (instituicoesParaDoar.length === 0) {
        return (
            <div className="lista-instituicoes lista-instituicoes--vazia">
                <p>Nenhuma instituição encontrada.</p>
            </div>
        );
    }

    return (
        <div className="lista-instituicoes">
            {instituicoesParaDoar.map(inst => (
                <InstituicaoCard
                    key={inst.id}
                    instituicao={inst}
                    onVerDetalhes={onVerDetalhes}
                    onDoar={onDoar}
                />
            ))}
        </div>
    );
}