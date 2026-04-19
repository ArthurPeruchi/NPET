import Botao from "../../../../components/Botao/Botao";
import "./ProvaSocial.css";

// Depoimentos mockados para ilustrar a seção de prova social :)
const DEPOIMENTOS = [
  {
    id: 1,
    nome: 'Marcos Túlio',
    hora: '15:10',
    data: '20/04/25',
    texto:
      'Encontrei um abrigo incrível pelo NPET. Doei ração, conheci a galera de lá e fiquei super feliz de ver o quanto eles cuidam bem dos animais.',
    curtidas: 32,
  },
  {
    id: 2,
    nome: 'Vinícius Loures',
    hora: '8:32',
    data: '30/03/25',
    texto:
      'Doei alguns brinquedos antigos para a ASPAAN e, dias depois, recebi fotos dos bichinhos brincando. Foi de aquecer o coração! ❤️',
    curtidas: 29,
  },
];
 
// Impactos mockados para ilustrar a seção de prova social
const IMPACTOS = [
  {
    id: 1,
    texto: (
      <>
        <strong>+900 animais</strong> alimentados e cuidados graças aos nossos doadores.
      </>
    ),
  },
  {
    id: 2,
    texto: (
      <>
        <strong>+120 visitas</strong> realizadas para entrega de doações em abrigos.
      </>
    ),
  },
  {
    id: 3,
    texto: (
      <>
        <strong>+80% das ONGs</strong> relataram melhora no gerenciamento após receberem apoio.
      </>
    ),
  },
];

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 13s-6-3.5-6-7a4 4 0 0 1 6-3.46A4 4 0 0 1 14 6c0 3.5-6 7-6 7z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="impacto-item-icon"
      viewBox="0 0 33 33"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="16" fill="var(--main-color)" />
      <path
        d="M9 16l5 5 9-9"
        stroke="white" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProvaSocial() {
    return (
        <>
            <section className="prova-social" aria-label="Depoimentos e impactos da comunidade">
                <article className="comentarios">
                    <h2>Veja o que Dizem</h2>
                    <p>
                        Depoimentos reais de quem acredita, doa e transforma vidas com a gente.
                    </p>

                    <ul className="depoimentos" aria-label="Depoimentos de doadores">
                        {DEPOIMENTOS.map(dep => (
                            <li key={dep.id} className="depoimento">
                                <div className="header-depoimento">
                                    <div className="avatar" aria-hidden="true">
                                        {dep.nome.charAt(0)}
                                    </div>
                                    <div className="meta-depoimento">
                                        <span className="nome">{dep.nome}</span>
                                        <span className="tempo">
                                            {dep.hora} · {dep.data}
                                        </span>
                                    </div>
                                </div>
                                <p className="texto-depoimento">{dep.texto}</p>
                                <div className="acoes">
                                    <button className="like" aria-label={`${dep.curtidas} curtidas`}>
                                        <HeartIcon />
                                        <span>{dep.curtidas}</span>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <Botao variant="secundario" size="md" className="btn-borda-preta" fullWidth>
                        Ver mais Depoimentos
                    </Botao>

                </article>

                <article className="impactos">
                    <h2>Impactos da Comunidade</h2>
                    <p>
                        Cada gesto seu fez toda a diferença! Veja o que já conquistamos juntos:
                    </p>

                    <ul className="impactos-lista" aria-label="Números de impacto">
                        {IMPACTOS.map(item => (
                            <li key={item.id} className="impacto-item">
                                <CheckIcon />
                                <p className="impacto-item-texto">{item.texto}</p>
                            </li>
                        ))}
                    </ul>

                    <Botao variant="secundario" size="md" className="btn-borda-preta">
                        Ver minhas Contribuições
                    </Botao>
                </article>
            </section>
        </>
    )
}