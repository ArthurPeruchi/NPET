import heroImg from "../../../../assets/imagem-heroi.avif";
import "./BannerHeroi.css";
import Botao from "../../../../components/Botao/Botao";

export default function BannerHeroi() {
    return (
        <>
            <section className="banner-hero">
                <div className="heroImg-wrap">
                    <img src={heroImg} alt="Imagem de herói do NPET" className="hero-image" />
                </div>

                <div className="hero-content">
                    <h1>Por trás de cada doação,<br />um focinho feliz.</h1>
                    <p>
                        Aqui, cada contribuição é um novo começo para animais que sonham
                        com uma segunda chance. Junte-se a nós!
                    </p>
                    <Botao variant="primario" size="lg">Comece a Doar</Botao>
                    <a href="#sobre" className="hero-link">Saiba mais sobre o NPET</a>
                </div>
            </section>
        </>
    )
}