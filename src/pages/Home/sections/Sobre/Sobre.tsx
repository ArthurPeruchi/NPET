import { useState, useEffect } from "react";
import "./Sobre.css";
import Botao from "../../../../components/Botao/Botao";

// Dados mockados para o carrosel :)
const IMPACTO_SLIDES = [
    { icon: <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" fill="#ffffff" viewBox="0 0 256 256"><path d="M212,80a28,28,0,1,0,28,28A28,28,0,0,0,212,80Zm0,40a12,12,0,1,1,12-12A12,12,0,0,1,212,120ZM72,108a28,28,0,1,0-28,28A28,28,0,0,0,72,108ZM44,120a12,12,0,1,1,12-12A12,12,0,0,1,44,120ZM92,88A28,28,0,1,0,64,60,28,28,0,0,0,92,88Zm0-40A12,12,0,1,1,80,60,12,12,0,0,1,92,48Zm72,40a28,28,0,1,0-28-28A28,28,0,0,0,164,88Zm0-40a12,12,0,1,1-12,12A12,12,0,0,1,164,48Zm23.12,100.86a35.3,35.3,0,0,1-16.87-21.14,44,44,0,0,0-84.5,0A35.25,35.25,0,0,1,69,148.82,40,40,0,0,0,88,224a39.48,39.48,0,0,0,15.52-3.13,64.09,64.09,0,0,1,48.87,0,40,40,0,0,0,34.73-72ZM168,208a24,24,0,0,1-9.45-1.93,80.14,80.14,0,0,0-61.19,0,24,24,0,0,1-20.71-43.26,51.22,51.22,0,0,0,24.46-30.67,28,28,0,0,1,53.78,0,51.27,51.27,0,0,0,24.53,30.71A24,24,0,0,1,168,208Z"></path></svg>,
      label: 'Impacto',
      value: '+X animais beneficiados' 
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" fill="#ffffff" viewBox="0 0 256 256"><path d="M128,40a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,40Zm0,176a80,80,0,1,1,80-80A80.09,80.09,0,0,1,128,216ZM173.66,90.34a8,8,0,0,1,0,11.32l-40,40a8,8,0,0,1-11.32-11.32l40-40A8,8,0,0,1,173.66,90.34ZM96,16a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H104A8,8,0,0,1,96,16Z"></path></svg>, 
      label: 'Tempo',
      value: '+X anos de atuação' 
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" fill="#ffffff" viewBox="0 0 256 256"><path d="M230.33,141.06a24.34,24.34,0,0,0-18.61-4.77C230.5,117.33,240,98.48,240,80c0-26.47-21.29-48-47.46-48A47.58,47.58,0,0,0,156,48.75,47.58,47.58,0,0,0,119.46,32C93.29,32,72,53.53,72,80c0,11,3.24,21.69,10.06,33a31.87,31.87,0,0,0-14.75,8.4L44.69,144H16A16,16,0,0,0,0,160v40a16,16,0,0,0,16,16H120a7.93,7.93,0,0,0,1.94-.24l64-16a6.94,6.94,0,0,0,1.19-.4L226,182.82l.44-.2a24.6,24.6,0,0,0,3.93-41.56ZM119.46,48A31.15,31.15,0,0,1,148.6,67a8,8,0,0,0,14.8,0,31.15,31.15,0,0,1,29.14-19C209.59,48,224,62.65,224,80c0,19.51-15.79,41.58-45.66,63.9l-11.09,2.55A28,28,0,0,0,140,112H100.68C92.05,100.36,88,90.12,88,80,88,62.65,102.41,48,119.46,48ZM16,160H40v40H16Zm203.43,8.21-38,16.18L119,200H56V155.31l22.63-22.62A15.86,15.86,0,0,1,89.94,128H140a12,12,0,0,1,0,24H112a8,8,0,0,0,0,16h32a8.32,8.32,0,0,0,1.79-.2l67-15.41.31-.08a8.6,8.6,0,0,1,6.3,15.9Z"></path></svg>, 
      label: 'Doações',
      value: '+X doações realizadas' 
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" fill="#ffffff" viewBox="0 0 256 256"><path d="M232,224H208V32h8a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16h8V224H24a8,8,0,0,0,0,16H232a8,8,0,0,0,0-16ZM64,32H192V224H160V184a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v40H64Zm80,192H112V192h32ZM88,64a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H96A8,8,0,0,1,88,64Zm48,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H144A8,8,0,0,1,136,64ZM88,104a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H96A8,8,0,0,1,88,104Zm48,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H144A8,8,0,0,1,136,104ZM88,144a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H96A8,8,0,0,1,88,144Zm48,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H144A8,8,0,0,1,136,144Z"></path></svg>, 
      label: 'Parcerias',
      value: '+X instituições parceiras' 
    },
    { 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" fill="#ffffff" viewBox="0 0 256 256"><path d="M128,88a40,40,0,1,0,40,40A40,40,0,0,0,128,88Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,152Zm73.71,7.14a80,80,0,0,1-14.08,22.2,8,8,0,0,1-11.92-10.67,63.95,63.95,0,0,0,0-85.33,8,8,0,1,1,11.92-10.67,80.08,80.08,0,0,1,14.08,84.47ZM69,103.09a64,64,0,0,0,11.26,67.58,8,8,0,0,1-11.92,10.67,79.93,79.93,0,0,1,0-106.67A8,8,0,1,1,80.29,85.34,63.77,63.77,0,0,0,69,103.09ZM248,128a119.58,119.58,0,0,1-34.29,84,8,8,0,1,1-11.42-11.2,103.9,103.9,0,0,0,0-145.56A8,8,0,1,1,213.71,44,119.58,119.58,0,0,1,248,128ZM53.71,200.78A8,8,0,1,1,42.29,212a119.87,119.87,0,0,1,0-168,8,8,0,1,1,11.42,11.2,103.9,103.9,0,0,0,0,145.56Z"></path></svg>,
      label: 'Abrangência',
      value: '+X cidades goianas' 
    },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" fill="#ffffff" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM80,108a12,12,0,1,1,12,12A12,12,0,0,1,80,108Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,176,108Zm-1.07,48c-10.29,17.79-27.4,28-46.93,28s-36.63-10.2-46.92-28a8,8,0,1,1,13.84-8c7.47,12.91,19.21,20,33.08,20s25.61-7.1,33.07-20a8,8,0,0,1,13.86,8Z"></path></svg>, 
      label: 'Satisfação',
      value: '+X% doadores satisfeitos' 
    },
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