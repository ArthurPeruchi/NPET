import NavBar from "../../components/NavBar/NavBar";
import BarraProgresso from "../../components/BarraProgresso/BarraProgresso";
import EtapaInstituicao from "./sections/Etapa 1/EtapaInstituicao";
import EtapaMetodo from "./sections/Etapa 2/EtapaMetodo";
import EtapaDetalhesMonetaria from "./sections/Etapa 3/DetalhesMonetaria/EtapaDetalhesMonetaria";
import EtapaDetalhesProduto from "./sections/Etapa 3/DetalhesProduto/EtapaDetalhesProduto";
import EtapaConfirmacao from "./sections/Etapa 4/EtapaConfirmacao";
import Rodape from "../../components/Rodape/Rodape";
import type { Instituicao, TipoDoacao, DadosDoacao, DadosDoacaoMonetaria, DadosDoacaoProduto } from "../../types/domain";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import Botao from "../../components/Botao/Botao";
import "./Doacoes.css";

export default function Doacoes() {
    const location = useLocation();
    
    const instPreSelecionada: Instituicao | null = location.state?.instituicaoPreSelecionada ?? null;

    const doacaoRepetida: DadosDoacaoMonetaria | null = instPreSelecionada
        ? location.state?.repetirDoacao ?? null
        : null;

    const [passoAtual, setPassoAtual] = useState<1 | 2 | 3 | 4>(doacaoRepetida ? 3 : instPreSelecionada ? 2 : 1);

    const [instituicaoEscolhida, setInstituicaoEscolhida] = useState<Instituicao | null>(instPreSelecionada);

    const [dadosDoacao, setDadosDoacao] = useState<DadosDoacao>(
        doacaoRepetida ?? { idInstituicao: instPreSelecionada?.id ?? null }
    );

    useScrollToTop(passoAtual);

    function salvarInstituicao(inst: Instituicao) {
        setInstituicaoEscolhida(inst);
        setDadosDoacao(d => ({ ...d, idInstituicao: inst.id }));
        setPassoAtual(2);
    }
    
    function salvarMetodo(tipo: TipoDoacao) {
        setDadosDoacao(d => ({idInstituicao: d.idInstituicao, tipoDoacao: tipo }));
        setPassoAtual(3);
    }

    function salvarDetalhes(detalhes: DadosDoacaoMonetaria | DadosDoacaoProduto) {
        setDadosDoacao(detalhes);
        setPassoAtual(4);
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

            {passoAtual === 3 && "tipoDoacao" in dadosDoacao && (
                dadosDoacao.tipoDoacao === "monetaria"
                    ? <EtapaDetalhesMonetaria dados={dadosDoacao} onAvancar={salvarDetalhes} />
                    : <EtapaDetalhesProduto />
            )}

            {/* 
                    : <EtapaDetalhesProduto   dados={dadosDoacao} onAvancar={salvarDetalhes} />
            */}
            

            {passoAtual === 4 && instituicaoEscolhida && "tipoDoacao" in dadosDoacao
                && dadosDoacao.tipoDoacao === "monetaria" && (
                <EtapaConfirmacao dados={dadosDoacao} instituicao={instituicaoEscolhida} />
            )}

            <Rodape />
        </>
    );
}