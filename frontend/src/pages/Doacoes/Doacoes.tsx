import NavBar from "../../components/NavBar/NavBar";
import BarraProgresso from "../../components/BarraProgresso/BarraProgresso";
import EtapaInstituicao from "./sections/Etapa 1/EtapaInstituicao";
import EtapaMetodo from "./sections/Etapa 2/EtapaMetodo";
import EtapaDetalhesMonetaria from "./sections/Etapa 3/DetalhesMonetaria/EtapaDetalhesMonetaria";
import EtapaDetalhesProduto from "./sections/Etapa 3/DetalhesProduto/EtapaDetalhesProduto";
import EtapaConfirmacao from "./sections/Etapa 4/EtapaConfirmacao";
import Rodape from "../../components/Rodape/Rodape";
import ModalConfirmacao from "../../components/ModalConfirmacao/ModalConfirmacao";
import type { Instituicao, TipoDoacao, DadosDoacao, DadosDoacaoMonetaria, DadosDoacaoProduto } from "../../types/domain";
import { useEffect, useState } from "react";
import { useBlocker, useLocation } from "react-router-dom";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import Botao from "../../components/Botao/Botao";
import "./Doacoes.css";

// Para o pop-up de confirmação de saída da página
const ROTULO_DESTINO: Record<string, string> = {
    "/": "Ir para o Início",
    "/historico": "Ir para o Histórico",
    "/perfil": "Ir para o Perfil",
    "/sair": "Sair da Conta",
};

function get_destination_label(pathname: string): string {
    return ROTULO_DESTINO[pathname] ?? "Sair da Doação";
}

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

    // Motivo da recusa do cartão, exibido na etapa de detalhes quando o usuário precisa digitar o cartão de novo.
    const [avisoCartao, setAvisoCartao] = useState<string | null>(null);

    const [doacaoRegistrada, setDoacaoRegistrada] = useState(false);
    const emAndamento = !doacaoRegistrada && passoAtual > 1;

    // Barra qualquer navegação interna para outra página (links, botão voltar do navegador...).
    const blocker = useBlocker(({ currentLocation, nextLocation }) =>
        emAndamento && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (!emAndamento) return;

        function handle_before_unload(e: BeforeUnloadEvent) {
            e.preventDefault();
            e.returnValue = "";
        }

        window.addEventListener("beforeunload", handle_before_unload);
        return () => window.removeEventListener("beforeunload", handle_before_unload);
    }, [emAndamento]);

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
        setAvisoCartao(null);
        setDadosDoacao(detalhes);
        setPassoAtual(4);
    }

    // O token do cartão vale para uma única tentativa: depois de recusado, o usuário digita o cartão de novo.
    function cartaoRecusado(motivo: string) {
        setAvisoCartao(motivo);
        setPassoAtual(3);
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
                    ? <EtapaDetalhesMonetaria dados={dadosDoacao} onAvancar={salvarDetalhes} aviso={avisoCartao ?? undefined} />
                    : <EtapaDetalhesProduto />
            )}

            {/* 
                    : <EtapaDetalhesProduto   dados={dadosDoacao} onAvancar={salvarDetalhes} />
            */}
            

            {passoAtual === 4 && instituicaoEscolhida && "tipoDoacao" in dadosDoacao
                && dadosDoacao.tipoDoacao === "monetaria" && (
                <EtapaConfirmacao
                    dados={dadosDoacao}
                    instituicao={instituicaoEscolhida}
                    on_registered={() => setDoacaoRegistrada(true)}
                    on_card_declined={cartaoRecusado}
                />
            )}

            {blocker.state === "blocked" && (
                <ModalConfirmacao
                    title="Cancelar sua Doação?"
                    primary_label="Continuar Doação"
                    on_primary={() => blocker.reset()}
                    secondary_label={get_destination_label(blocker.location.pathname)}
                    on_secondary={() => blocker.proceed()}
                    on_dismiss={() => blocker.reset()}
                >
                    <p className="modal-confirmacao-destaque">Tem certeza que deseja sair?</p>
                    <p>Todas as informações preenchidas até agora serão perdidas.</p>
                </ModalConfirmacao>
            )}

            <Rodape />
        </>
    );
}