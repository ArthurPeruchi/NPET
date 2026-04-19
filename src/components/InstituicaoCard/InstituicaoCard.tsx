import "./InstituicaoCard.css";
import Botao from "../Botao/Botao";

export default function InstituicaoCard({ instituicao, onVerDetalhes }) {
  const { nome, logo, cidade, uf } = instituicao;
 
  return (
    <article className="card-instituicao">
      <div className="card-instituicao-wrapper-logo">
        {logo
          ? <img className="card-instituicao-logo" src={logo} alt={`Logo da ${nome}`} />
          : <div className="card-instituicao-logo-placeholder" aria-hidden="true" />
        }
      </div>
 
      <div className="card-instituicao-body">
        <h3 className="card-instituicao-nome">{nome}</h3>
        <p className="card-instituicao-local">
          <svg className="card-instituicao-pin" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 1.5A4.5 4.5 0 0 0 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6A4.5 4.5 0 0 0 8 1.5z"
              stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
          </svg>
          {cidade} - {uf}
        </p>
      </div>
 
      <Botao
        variant="secundario"
        size="md"
        fullWidth
        onClick={() => onVerDetalhes(instituicao)}
        className="btn-borda-preta"
      >
        Ver Detalhes
      </Botao>
    </article>
  );
}