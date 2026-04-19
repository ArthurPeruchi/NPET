import { useState, useEffect } from "react";
import "./Sobre.css";
import Botao from "../../../../components/Botao/Botao";

// Dados mockados para o carrosel :)
const IMPACTO_SLIDES = [
    { icon: '🐾', label: 'Impacto',      value: '+900 animais beneficiados' },
    { icon: '⏱️', label: 'Tempo',        value: '+2 anos de atuação' },
    { icon: '🤝', label: 'Doações',      value: '+200 doações realizadas' },
    { icon: '🏛️', label: 'Parcerias',    value: '+10 instituições parceiras' },
    { icon: '📍', label: 'Abrangência',  value: '+10 cidades goianas' },
    { icon: '😊', label: 'Satisfação',   value: '98% doadores satisfeitos' },
];

export default function Sobre() {
    const [slide, setSlide] = useState(0);

    const prev = () => setSlide(s => (s - 1 + IMPACTO_SLIDES.length) % IMPACTO_SLIDES.length);
    const next = () => setSlide(s => (s + 1) % IMPACTO_SLIDES.length);
    
    const current = IMPACTO_SLIDES[slide];

    useEffect(() => {
        const interval = setInterval(() => {
            next();
        }, 7000);

        return () => clearInterval(interval);
    }, [slide]);

    return (
        <section id="sobre" className="sobre">
            <div className="sobre-inner">
                <div className="sobre-texto">
                    <h2 className="texto-sobre">Sobre o NPET</h2>
                    <p className="texto-sobre">
                        O NPET é uma plataforma digital filantrópica que conecta doadores a ONGs e abrigos
                        que cuidam de animais em situação de rua. Desenvolvido em parceria com a UniEVANGÉLICA 
                        (Campus Anápolis), o projeto visa transformar a realidade de milhares de animais do
                        estado de Goiás, fortalecendo organizações que dedicam suas vidas a essa causa. 
                    </p>

                    <p className="texto-sobre">
                        Acreditamos fortemente que toda doação deve ser acompanhada de confiança e
                        responsabilidade. Por isso, o NPET valoriza a transparência em cada etapa: nossos
                        doadores podem acompanhar suas contribuições em tempo real, visualizando o impacto que 
                        estão gerando e fortalecendo ainda mais o elo entre quem ajuda e quem é ajudado.
                    </p>

                    <h2 className="texto-sobre">Ajude a manter o NPET funcionando</h2>
                    <p className="texto-sobre">
                        Somos um projeto filantrópico, sem fins lucrativos, e contamos com o apoio da comunidade 
                        para manter a plataforma ativa, segura e acessível para todos. Caso deseje, você pode contribuir
                        voluntariamente para o NPET e nos ajudar a ampliar nosso impacto, fortalecendo a rede de proteção
                        animal e garantindo que mais animais recebam o cuidado que merecem. Toda contribuição é opcional,
                        transparente e direcionada exclusivamente para o funcionamento e expansão do projeto.
                    </p>
                    <Botao variant="secundario" size="md">Doar para o NPET</Botao>
                </div>
                
                <aside className="card-sobre" aria-label="Estatísticas de impacto">
                    <div className="card-impacto">
                        <div className="card-impacto-icon" aria-hidden="true">
                            {current.icon}
                        </div>
                        <p className="card-impacto-label">{current.label}</p>
                        <p className="card-impacto-value">{current.value}</p>

                        <div className="card-impacto-nav" role="group" aria-label="Navegar estatísticas">
                            <button
                                className="card-impacto-arrow"
                                onClick={prev}
                                aria-label="Estatística anterior"
                            >
                                ‹
                            </button>
                            <div className="card-impacto-dots" role="tablist">
                                {IMPACTO_SLIDES.map((_, i) => (
                                    <button
                                        key={i}
                                        role="tab"
                                        aria-selected={i === slide}
                                        aria-label={`Estatística ${i + 1}`}
                                        className={`card-impacto-dot ${i === slide ? 'card-impacto-dot--active' : ''}`}
                                        onClick={() => setSlide(i)}
                                    />
                                ))}
                            </div>
                            <button
                                className="card-impacto-arrow"
                                onClick={next}
                                aria-label="Próxima estatística"
                            >
                                ›
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </section>
    );
}