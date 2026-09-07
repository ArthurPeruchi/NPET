import NavBar from "../../components/NavBar/NavBar";
import BarraProgresso from "../../components/BarraProgresso/BarraProgresso";
import EtapaInstituicao from "./sections/Etapa 1/EtapaInstituicao";
import EtapaMetodo from "./sections/Etapa 2/EtapaMetodo";
import Rodape from "../../components/Rodape/Rodape";
import type { Instituicao, TipoDoacao, DadosDoacao } from "../../types/domain";
import { useState } from "react";
import { useLocation } from "react-router-dom";

export default function Doacoes() {
    const location = useLocation();
    const instPreSelecionada: Instituicao | null = location.state?.instituicaoPreSelecionada ?? null;

    const [passoAtual, setPassoAtual] = useState<1 | 2 | 3 | 4>(instPreSelecionada ? 2 : 1);

    const [dadosDoacao, setDadosDoacao] = useState<DadosDoacao>({
        idInstituicao: instPreSelecionada?.id ?? null,
    });

    function salvarInstituicao(inst: Instituicao) {
        setDadosDoacao(d => ({ ...d, idInstituicao: inst.id }));
        setPassoAtual(2);
    }

    /*
    function salvarMetodo(tipo: TipoDoacao) {
        setDadosDoacao(d => ({ ...d, tipoDoacao: tipo }));
        setPassoAtual(3);
    }

    function voltar() {
        setPassoAtual(p => (p > 1 ? (p - 1) as 1 | 2 | 3 | 4 : 1));
    }
    */

    return (
        <>
            <NavBar />
            <BarraProgresso passoAtual={passoAtual} onPassoClick={(passo) => setPassoAtual(passo)} />

            {passoAtual === 1 && (
                <EtapaInstituicao
                    onAvancar={salvarInstituicao}
                />
            )}

            {passoAtual === 2 && (
                <EtapaMetodo />
            )}

            {/*
            {passoAtual === 2 && (
                <EtapaMetodo
                    instituicao={dadosDoacao.instituicao!}
                    onAvancar={salvarMetodo}
                    onVoltar={voltar}
                />
            )}
            */}
            {/* passoAtual === 3 && <EtapaDetalhes ... /> */}
            {/* passoAtual === 4 && <EtapaConfirmacao ... /> */}

            <Rodape />
        </>
    );
}