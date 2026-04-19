import { useState } from "react";
import Botao from "../../../../components/Botao/Botao";
import InstituicaoCard from "../../../../components/InstituicaoCard/InstituicaoCard";
import "./Instituicoes.css";

// Dados mockados para as instituições :D
const INSTITUICOES = [
  {
    id: 1,
    nome: 'UniEVANGÉLICA - Universidade Evangélica de Goiás',
    logo: null,
    cidade: 'Anápolis',
    uf: 'GO',
    cnpj: '—',
    animais: '—',
    horario: '—',
    descricao: 'Universidade parceira no desenvolvimento do projeto NPET.',
  },
  {
    id: 2,
    nome: 'ASPAAN - Associação Protetora e Amiga dos Animais',
    logo: null,
    cidade: 'Anápolis',
    uf: 'GO',
    cnpj: '11.102.088/0001-79',
    animais: '~700 animais',
    horario: 'Sem horário fixo',
    descricao: 'ONG que cuida e protege animais em situação de vulnerabilidade em Anápolis.',
  },
  {
    id: 3,
    nome: 'ONG Patas Solidárias - Associação Amigos em Ação',
    logo: null,
    cidade: 'Anápolis',
    uf: 'GO',
    cnpj: '—',
    animais: '~200 animais',
    horario: 'Segunda a sexta, 8h–17h',
    descricao: 'Associação dedicada ao resgate e adoção responsável de animais.',
  },
  {
    id: 4,
    nome: 'SOS Animais Anápolis',
    logo: null,
    cidade: 'Anápolis',
    uf: 'GO',
    cnpj: '—',
    animais: '~150 animais',
    horario: 'Todos os dias, 7h–18h',
    descricao: 'Grupo voluntário focado em resgates emergenciais e cuidados veterinários.',
  },
  {
    id: 5,
    nome: 'Grupo Miau AuAu - Proteção aos Animais',
    logo: null,
    cidade: 'Anápolis',
    uf: 'GO',
    cnpj: '—',
    animais: '~80 animais',
    horario: 'Fins de semana',
    descricao: 'Grupo independente que promove adoções e campanhas de castração.',
  },
];

const CARDS_VISIVEIS = 3;

export default function Instituicoes() {
  const [inicio, setInicio] = useState(0);
  
  const [modalAberto, setModalAberto] = useState(false);
  const [instSelecionada, setInstSelecionada] = useState(null);

  const podePrev = inicio > 0;
  const podeNext = inicio + CARDS_VISIVEIS < INSTITUICOES.length;
 
  const prev = () => { if (podePrev) setInicio(i => i - 1); };
  const next = () => { if (podeNext) setInicio(i => i + 1); };
  
  const abrirDetalhes = (inst) => {
    setInstSelecionada(inst);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setInstSelecionada(null);
  };
 
  const visiveis = INSTITUICOES.slice(inicio, inicio + CARDS_VISIVEIS);

  return (
    <section className="instituicoes">
        <h2>Conheça nossas Instituições Parceiras</h2>
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
                  onVerDetalhes={abrirDetalhes}
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

        <h2>Tem interesse em se tornar um parceiro?</h2>
        <p>
            Se você representa uma ONG, clínica veterinária, empresa do setor pet, ou deseja apoiar a causa de forma estruturada,
            o NPET quer caminhar com você. Sua instituição pode fazer parte da nossa rede!
        </p>

        <Botao variant="primario" size="md" className="btn-parceiro">Torne-se Parceiro</Botao>
    </section>
  );
}