import "./SelecaoMetodo.css"
import Botao from "../../../../../components/Botao/Botao";
import type { TipoDoacao } from "../../../../../types/domain";

type SelecaoMetodoProps = {
    onAvancar: (tipo: TipoDoacao) => void;
}

export default function SelecaoMetodo({ onAvancar }: SelecaoMetodoProps) {
    return(
        <div className="selecao-metodo">
            <h2>Como você deseja ajudar?</h2>
            <p>Escolha se deseja doar em dinheiro ou produtos.</p>
            
            <div className="botoes">
                <Botao 
                    size="md"
                    className="btn-doar-dinheiro"
                    onClick={() => onAvancar("monetaria")}
                >
                    Doação Monetária
                </Botao>

                <Botao 
                    size="md" 
                    className="btn-doar-produto"
                    onClick={() => onAvancar("produto")}
                >
                    Doação em Produto
                </Botao>
            </div>
        </div>
    )
}