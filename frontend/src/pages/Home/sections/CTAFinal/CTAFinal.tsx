import Botao from "../../../../components/Botao/Botao"
import "./CTAFinal.css"

export default function CTAFinal() {
    return (
        <section className="cta-final" aria-label="Chamada para ação final">
            <p>
                Seu gesto pode mudar a vida de quem mais precisa. Vamos participar
                juntos dessa comunidade de amor?
            </p>
            <Botao variant="primario" size="md">Comece a Doar</Botao>
        </section>
    )
}