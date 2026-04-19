import "./Rodape.css"

const MAPA_SITE = [
  { label: 'Início',                href: '/' },
  { label: 'Nova Doação',           href: '/doar' },
  { label: 'Histórico de Doações',  href: '/historico' },
  { label: 'Instituições Parceiras',href: '/parcerias' },
  { label: 'Nossas Avaliações',     href: '/avaliacoes' },
  { label: 'Suporte',               href: '/suporte' },
];
 
const CONTATO = [
  {
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1" y="3" width="14" height="10" rx="2"
          stroke="currentColor" strokeWidth="1.3"/>
        <path d="M1 5.5l7 5 7-5" stroke="currentColor" strokeWidth="1.3"
          strokeLinecap="round"/>
      </svg>
    ),
    label: 'contato@npet.org.br',
    href: 'mailto:contato@npet.org.br',
  },
  {
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 2h3l1.5 3.5-1.75 1.25A9 9 0 0 0 10.25 10.25L11.5 8.5 15 10v3c0 1.1-.9 2-2 2A12 12 0 0 1 1 4c0-1.1.9-2 2-2z"
          stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    ),
    label: '(62) XXXX-XXXX',
    href: 'tel:+5562XXXXXXXX',
  },
  {
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1.5A4.5 4.5 0 0 0 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6A4.5 4.5 0 0 0 8 1.5z"
          stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
    label: 'Anápolis - GO, Brasil',
    href: null,
  },
];
 
const REDES_SOCIAIS = [
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="13" height="13" rx="4"
          stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="11.5" cy="4.5" r="0.75" fill="currentColor"/>
      </svg>
    ),
  },
    {
    label: 'WhatsApp',
    href: 'https://whatsapp.com',
    icon: (
        <svg
        viewBox="0 0 256 256"
        width="16"
        height="16"
        fill="currentColor"
        aria-hidden="true"
        >
        <path d="M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155l14.61-9.74,23,11.48A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z" />
        </svg>
    ),
    },
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M9.5 5H8.25A1.25 1.25 0 0 0 7 6.25V7.5H6v2h1v4h2v-4h1.5l.5-2H9V6.5a.5.5 0 0 1 .5-.5h1V5z"
          stroke="currentColor" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1.5" y="1.5" width="13" height="13" rx="3"
          stroke="currentColor" strokeWidth="1.3"/>
        <path d="M4.5 6.5v5M4.5 4.5v.5" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7.5 11.5V9a1.5 1.5 0 0 1 3 0v2.5M7.5 6.5v5"
          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function Rodape() {
    return (
        <footer className="rodape" aria-label="Rodapé do site" role="contentinfo">
            <div className="rodape-inner">
                <div className="rodape-brand">
                    <div className="rodape-logo" aria-hidden="true">
                    </div>
                    <p className="rodape-tagline">
                        Juntos, podemos transformar a vida de N pets.
                    </p>
                </div>

                <div className="rodape-cols">
                    <nav className="rodape-col" aria-label="Mapa do site">
                        <h3>Mapa do Site</h3>
                        <ul className="rodape-links">
                            {MAPA_SITE.map(item => (
                                <li key={item.href}>
                                    <a className="rodape-link" href={item.href}>
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="rodape-col">
                        <h3>Contato</h3>
                        <ul className="rodape-lista-contatos">
                            {CONTATO.map((item, i) => (
                                <li key={i} className="rodape-contato-item">
                                    <span className="rodape-contato-icon">{item.icon}</span>
                                    {item.href
                                        ? <a className="rodape-link" href={item.href}>{item.label}</a>
                                        : <span className="rodape-contato-text">{item.label}</span>
                                    }
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rodape-col">
                        <h3>Redes Sociais</h3>
                        <ul className="rodape-lista-sociais">
                            {REDES_SOCIAIS.map(item => (
                                <li key={item.label}>
                                    <a className="rodape-social-link" href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
                                        <span className="rodape-social-icon">{item.icon}</span>
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>      
                </div>

                <div className="rodape-divisoria" role="separator" />

                <div className="copyright">
                    <p>&copy; 2026 NPET. Projeto acadêmico desenvolvido em parceria com a UniEVANGÉLICA - Todos os direitos reservados.</p>
                    <p>
                        As informações exibidas são fictícias. Fotos por Unsplash.
                    </p>
                </div>
            </div>
        </footer>
    )
}