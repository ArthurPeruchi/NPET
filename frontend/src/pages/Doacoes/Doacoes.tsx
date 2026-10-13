import NavBar from "../../components/NavBar/NavBar";
import BarraProgresso from "../../components/BarraProgresso/BarraProgresso";
import EtapaInstituicao from "./sections/Etapa 1/EtapaInstituicao";
import EtapaMetodo from "./sections/Etapa 2/EtapaMetodo";
import Rodape from "../../components/Rodape/Rodape";
import type { Instituicao, TipoDoacao, DadosDoacao } from "../../types/domain";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import Botao from "../../components/Botao/Botao";
import "./Doacoes.css";

export default function Doacoes() {
    const location = useLocation();
    
    const instPreSelecionada: Instituicao | null = location.state?.instituicaoPreSelecionada ?? null;

    const [passoAtual, setPassoAtual] = useState<1 | 2 | 3 | 4>(instPreSelecionada ? 2 : 1);

    const [dadosDoacao, setDadosDoacao] = useState<DadosDoacao>({
        idInstituicao: instPreSelecionada?.id ?? null,
    });

    useScrollToTop(passoAtual);

    function salvarInstituicao(inst: Instituicao) {
        setDadosDoacao(d => ({ ...d, idInstituicao: inst.id }));
        setPassoAtual(2);
    }

    
    function salvarMetodo(tipo: TipoDoacao) {
        setDadosDoacao(d => ({ ...d, tipoDoacao: tipo }));
        setPassoAtual(3);

        console.log("Dados da doação:", { ...dadosDoacao, tipoDoacao: tipo });
    }

    function voltar() {
        setPassoAtual(p => (p > 1 ? (p - 1) as 1 | 2 | 3 | 4 : 1));
    }

    const voltarIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#777777" viewBox="0 0 256 256">
            <path d="M232,112a64.07,64.07,0,0,1-64,64H88v40a8,8,0,0,1-13.66,5.66l-48-48a8,8,0,0,1,0-11.32l48-48A8,8,0,0,1,88,120v40h80a48,48,0,0,0,0-96H80a8,8,0,0,1,0-16h88A64.07,64.07,0,0,1,232,112Z"></path>
        </svg>
    );

    return (
        <>
            <NavBar />

            <div className="header-barra">
                <div className="header-barra-esq">
                    <Botao
                        variant="terciario"
                        disabled={passoAtual === 1}
                        onClick={voltar}
                        className="botao-voltar"
                        icon={voltarIcon}
                    >
                        
                    </Botao>
                </div>
                
                <BarraProgresso passoAtual={passoAtual} onPassoClick={(passo) => setPassoAtual(passo)} />
            
                <div className="header-barra-dir" />
            </div>

            {passoAtual === 1 && (
                <EtapaInstituicao
                    onAvancar={salvarInstituicao}
                />
            )}

            {passoAtual === 2 && (
                <EtapaMetodo
                    onAvancar={salvarMetodo} 
                />
            )}

            {/* passoAtual === 3 && <EtapaDetalhes ... /> */}
            {/* passoAtual === 4 && <EtapaConfirmacao ... /> */}

            <Rodape />
        </>
    );
}