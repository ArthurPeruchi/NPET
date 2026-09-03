import { useEffect } from "react";
import type { Instituicao } from "../../types/domain";
import Botao from "../Botao/Botao";
import "./ModalInstituicao.css";

function IconePin() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5A4.5 4.5 0 0 0 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6A4.5 4.5 0 0 0 8 1.5z"
        stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}

function IconeInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="13" height="13" rx="4" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="11.5" cy="4.5" r="0.75" fill="currentColor"/>
    </svg>
  );
}

function IconeFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M9.5 5H8.25A1.25 1.25 0 0 0 7 6.25V7.5H6v2h1v4h2v-4h1.5l.5-2H9V6.5a.5.5 0 0 1 .5-.5h1V5z"
        stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
    </svg>
  );
}

function IconeEmail() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1 5.5l7 5 7-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function IconeLinkedin() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M4.5 6.5v5M4.5 4.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7.5 11.5V9a1.5 1.5 0 0 1 3 0v2.5M7.5 6.5v5"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconeWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d="M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155l14.61-9.74,23,11.48A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z"/>
    </svg>
  );
}

function IconeSite() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M8 1.5C6.5 4 5.5 6 5.5 8s1 4 2.5 6.5M8 1.5C9.5 4 10.5 6 10.5 8s-1 4-2.5 6.5M1.5 8h13"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function IconeCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconeX() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#e55959" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z">
      </path>
    </svg>
  );
}

type ModalDetalhesInstituicaoProps = {
  instituicao: Instituicao;
  onFechar:    () => void;
  onDoar?:     (inst: Instituicao) => void;
  onVerFotos?: (inst: Instituicao) => void;
};

export default function ModalDetalhesInstituicao({
  instituicao,
  onFechar,
  onDoar,
  onVerFotos,
}: ModalDetalhesInstituicaoProps) {
  const rs = instituicao.redesSociais ?? {};

  const redesSociais = [
    { label: "Instagram", href: rs.instagram, icone: <IconeInstagram /> },
    { label: "Facebook",  href: rs.facebook,  icone: <IconeFacebook /> },
    { label: "E-mail",    href: rs.email ? `mailto:${rs.email}` : undefined, icone: <IconeEmail /> },
    { label: "LinkedIn",  href: rs.linkedin,  icone: <IconeLinkedin /> },
    { label: "WhatsApp",  href: rs.whatsapp,  icone: <IconeWhatsApp /> },
    { label: "Site",      href: rs.site,      icone: <IconeSite /> },
  ];

  /* Fecha com Escape */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onFechar]);

  /* Trava o scroll do body enquanto o modal está aberto */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes de ${instituicao.nome}`}
      onClick={onFechar}
    >
      <div
        className="modal-container"
        onClick={e => e.stopPropagation()}
      >

        {/* Header fixo */}
        <div className="modal-header">
          <h2 className="modal-titulo">Detalhes da Instituição</h2>
          <button
            className="modal-btn-fechar"
            onClick={onFechar}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="modal-corpo">

          {/* Logo + Nome */}
          <div className="modal-hero">
            <div className="modal-logo-wrap">
              {instituicao.logo
                ? <img src={instituicao.logo} alt={`Logo de ${instituicao.nome}`} className="modal-logo" />
                : <div className="modal-logo-placeholder" aria-hidden="true" />
              }
            </div>
            <h3 className="modal-nome">{instituicao.nome}</h3>
          </div>

          <hr className="modal-divisor" />

          {/* Endereço */}
          {instituicao.endereco && (
            <div className="modal-endereco">
              <span className="modal-endereco-icone"><IconePin /></span>
                  <span className="modal-endereco">{instituicao.endereco}</span>
            </div>
          )}

          {/* Redes Sociais */}
          {redesSociais.some(r => r.href) && (
            <div className="modal-campo">
              <span className="modal-campo-label">Redes Sociais</span>
              <div className="modal-redes-grid">
                {redesSociais.map(r => r.href && (
                  <a
                    key={r.label}
                    href={r.href}
                    className="modal-rede-item"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={r.label}
                  >
                    <span className="modal-rede-icone">{r.icone}</span>
                    {r.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* CNPJ + Animais — duas colunas */}
          {(instituicao.cnpj || instituicao.animaisSobCuidado) && (
            <div className="modal-grid-2">
              {instituicao.cnpj && (
                <div className="modal-campo">
                  <span className="modal-campo-label">
                    CNPJ da Instituição
                  </span>
                  <span className="modal-campo-valor">
                    {instituicao.cnpj}
                  </span>
                </div>
              )}

              {instituicao.animaisSobCuidado && (
                <div className="modal-campo">
                  <span className="modal-campo-label">
                    Animais sob Cuidado
                  </span>
                  <span className="modal-campo-valor">
                    {instituicao.animaisSobCuidado} animais
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Horário */}
          {instituicao.horarioFuncionamento && (
            <div className="modal-campo">
              <span className="modal-campo-label">Horário de Funcionamento</span>
              <span className="modal-campo-valor">{instituicao.horarioFuncionamento}</span>
            </div>
          )}

          {/* Descrição */}
          {instituicao.descricao && (
            <div className="modal-campo">
              <span className="modal-campo-label">Descrição</span>
              <span className="modal-campo-valor">{instituicao.descricao}</span>
            </div>
          )}

          {/* Principais Necessidades */}
          {instituicao.principaisNecessidades && (
            <div className="modal-campo">
              <span className="modal-campo-label">Principais Necessidades</span>
              <span className="modal-campo-valor">{instituicao.principaisNecessidades}</span>
            </div>
          )}

          {/* Aceita Voluntários */}
          {instituicao.aceitaVoluntarios !== undefined && (
            <div className="modal-campo">
              <div className="modal-voluntario">
                <div className="modal-voluntario-resposta">
                  <span className="modal-campo-label">
                    Aceita Trabalho Voluntário?
                  </span>

                  <span
                    className={`modal-voluntario-status ${
                      instituicao.aceitaVoluntarios
                        ? "modal-voluntario-status--sim"
                        : "modal-voluntario-status--nao"
                    }`}
                  >
                    {instituicao.aceitaVoluntarios
                      ? <><IconeCheck /> Sim</>
                      : <><IconeX /> Não</>
                    }
                  </span>
                </div>

                {instituicao.aceitaVoluntarios && (
                  <Botao
                    variant="primario"
                    size="md"
                    className="btn-saibamais"
                    disabled
                  >
                    Saiba Mais
                  </Botao>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer fixo */}
        <div className="modal-footer">
          <div className={`modal-footer-acoes ${!instituicao.aceitaDoacoes ? "modal-footer-acoes--unica" : ""}`}>
            <Botao
              variant="primario"
              size="md"
              fullWidth
              onClick={() => onVerFotos?.(instituicao)}
              disabled
            >
              Ver Fotos
            </Botao>

            {instituicao.aceitaDoacoes && (
              <Botao
                variant="primario"
                size="md"
                fullWidth
                onClick={() => onDoar?.(instituicao)}
              >
                Fazer uma Doação
              </Botao>
            )}
          </div>
          
          <Botao
            variant="secundario"
            size="md"
            fullWidth
            onClick={onFechar}
          >
            Voltar
          </Botao>
        </div>

      </div>
    </div>
  );
}