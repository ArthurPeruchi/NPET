import { useState } from "react";
import Botao from "../../../../components/Botao/Botao";
import InstituicaoCard from "../../../../components/InstituicaoCard/InstituicaoCard";
import ModalInstituicao from "../../../../components/ModalInstituicao/ModalInstituicao";
import "./Instituicoes.css";
import { INSTITUICOES } from "../../../../mocks/mockInstituicoes";
import type { Instituicao } from "../../../../types/domain";
import useIsMobile from "../../../../hooks/useIsMobile";

export default function Instituicoes() {
  const [inicio, setInicio] = useState(0);
  const isMobile = useIsMobile();
  const CARDS_VISIVEIS = isMobile ? 1 : 3;

  const [instSelecionada, setInstSelecionada] = useState<Instituicao | null>(null);

  const podePrev = inicio > 0;
  const podeNext = inicio + CARDS_VISIVEIS < INSTITUICOES.length;

  const prev = () => { if (podePrev) setInicio(i => i - 1); };
  const next = () => { if (podeNext) setInicio(i => i + 1); };

  const visiveis = INSTITUICOES.slice(inicio, inicio + CARDS_VISIVEIS);

  return (
    <section className="instituicoes">
      <h2 className="instituicoes-title">Conheça nossas Instituições Parceiras</h2>

      <div className="instituicoes-carrossel" role="region" aria-label="Carrossel de instituições">
        <button
          className="instituicoes-carrosel-arrow"
          onClick={prev}
          disabled={!podePrev}
          aria-label="Instituições anteriores"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="instituicoes-cards" role="list">
          {visiveis.map(inst => (
            <InstituicaoCard
              key={inst.id}
              instituicao={inst}
              onVerDetalhes={setInstSelecionada}   // abre o modal
            />
          ))}
        </div>

        <button
          className="instituicoes-carrosel-arrow"
          onClick={next}
          disabled={!podeNext}
          aria-label="Próximas instituições"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <h2 className="instituicoes-title">Tem interesse em se tornar um parceiro?</h2>
      <p className="instituicoes-texto-parceiro">
        Se você representa uma ONG, clínica veterinária, empresa do setor pet, ou deseja apoiar
        a causa de forma estruturada, o NPET quer caminhar com você. Sua instituição pode fazer
        parte da nossa rede!
      </p>

      <Botao variant="primario" size="md" className="btn-parceiro">
        Torne-se Parceiro
      </Botao>

      {/* Modal */}
      {instSelecionada && (
        <ModalInstituicao
          instituicao={instSelecionada}
          onFechar={() => setInstSelecionada(null)}
          onDoar={() => { window.location.href = "/doacoes"; }}
        />
      )}
    </section>
  );
}