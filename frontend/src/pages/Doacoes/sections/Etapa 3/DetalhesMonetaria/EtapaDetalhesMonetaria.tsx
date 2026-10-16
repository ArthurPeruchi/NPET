import type { DadosDoacaoMonetaria, FormaPagamento } from "../../../../../types/domain";
import MenuDropdown, { type OpcaoDropdown } from "../../../../../components/MenuDropdown/MenuDropdown";
import CampoTexto from "../../../../../components/CampoTexto/CampoTexto";
import Botao from "../../../../../components/Botao/Botao";
import { useState } from "react";
import "./EtapaDetalhesMonetaria.css"

const IconePix = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#32bcad" viewBox="0 0 256 256">
        <path d="M235.34,139.28l-19.56,19.55A4,4,0,0,1,213,160H171.32l-32-32,32-32H213a4,4,0,0,1,2.82,1.17l19.56,19.55A16,16,0,0,1,235.34,139.28ZM67.05,80H88a8,8,0,0,1,5.65,2.34L128,116.68l34.35-34.34A8,8,0,0,1,168,80H189a4,4,0,0,0,2.83-6.83l-52.5-52.51a16,16,0,0,0-22.56,0L64.22,73.17A4,4,0,0,0,67.05,80ZM189,176H168a8,8,0,0,1-5.65-2.34L128,139.31,93.65,173.66A8,8,0,0,1,88,176h-21a4,4,0,0,0-2.83,6.83l52.5,52.51a16,16,0,0,0,22.56,0l52.5-52.51A4,4,0,0,0,189,176Zm-72.26-48-32-32H43a4,4,0,0,0-2.82,1.17L20.66,116.72a16,16,0,0,0,0,22.56l19.56,19.55A4,4,0,0,0,43,160H84.68Z"></path>
    </svg>
)

const IconeCartaoCredito = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#374151" viewBox="0 0 256 256">
        <path d="M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48ZM136,176H120a8,8,0,0,1,0-16h16a8,8,0,0,1,0,16Zm64,0H168a8,8,0,0,1,0-16h32a8,8,0,0,1,0,16ZM32,88V64H224V88Z"></path>
    </svg>
)

const OPCOES_PAGAMENTO: OpcaoDropdown<FormaPagamento>[] = [
    { valor: "pix", label: "PIX", icone: <IconePix /> },
    { valor: "cartao_credito", label: "Cartão de Crédito", icone: <IconeCartaoCredito /> },
];

export type EtapaDetalhesMonetariaProps = {
    dados: DadosDoacaoMonetaria;
    onAvancar: (detalhes: DadosDoacaoMonetaria) => void;
}

type ErrosFormulario = {
    valorDoacao?: string;
    formaPagamento?: string;
};

export default function EtapaDetalhesMonetaria() {
    const [valorDoacao, setValorDoacao] = useState<string>("");
    const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | null>(null);
    const [nomeCartao, setNomeCartao] = useState<string>("");
    const [numeroCartao, setNumeroCartao] = useState<string>("");
    const [dataValidade, setDataValidade] = useState<string>("");
    const [cvv, setCvv] = useState<string>("");
    const [erros, setErros] = useState<ErrosFormulario>({});

    const incompleto = !valorDoacao || !formaPagamento 
        || (formaPagamento === "cartao_credito" && ((!nomeCartao) || !numeroCartao || !dataValidade || !cvv));

    function converterParaNumero(valor: string): number {
        return Number(
            valor
                .replace("R$", "")
                .replace(/\./g, "")
                .replace(",", ".")
                .trim()
        ) || 0;
    }

    function handleAvancar() {
        const valor = converterParaNumero(valorDoacao);

        const novosErros: ErrosFormulario = {};
        if (!valor || isNaN(valor) || valor <= 0) {
            novosErros.valorDoacao = "Informe um valor válido para a doação.";
        }

        if (valor > 10000) {
            novosErros.valorDoacao = "O valor máximo permitido para doação é R$ 10.000,00.";
        }


        if (valor < 1) {
            novosErros.valorDoacao = "O valor mínimo permitido para doação é R$ 1,00.";
        }

        if (!formaPagamento) {
            novosErros.formaPagamento = "Selecione uma forma de pagamento.";
        }
        setErros(novosErros);
    
        if (Object.keys(novosErros).length > 0) {
            return;
        }
    }

    return (
        <div className="detalhes-monetaria">
            <h2>Vamos preparar sua doação?</h2>
            <p className="subtitulo">Defina o valor que deseja doar e selecione a forma de pagamento.</p>

            <CampoTexto
                label="Valor da Doação"
                variante="valor"
                className="campos-cartao"
                value={valorDoacao}
                onChange={setValorDoacao}
                placeholder="R$ 0,00"
                erro={erros.valorDoacao}
                required
            />

            <MenuDropdown<FormaPagamento>
                label="Forma de Pagamento"
                className="campos-cartao"
                opcoes={OPCOES_PAGAMENTO}
                value={formaPagamento}
                onChange={setFormaPagamento}
                placeholder="Como você deseja realizar a transação?"
                erro={erros.formaPagamento}
            />

            {formaPagamento == "cartao_credito" &&
                <>
                    <CampoTexto
                        label="Número do Cartão"
                        variante="numeroCartao"
                        className="campos-cartao"
                        value={numeroCartao}
                        onChange={setNumeroCartao}
                        placeholder="0000 0000 0000 0000"
                        required
                    /> 
                    
                    <CampoTexto
                        label="Nome no Cartão"
                        variante="texto"
                        value={nomeCartao}
                        onChange={setNomeCartao}
                        placeholder="Nome impresso no cartão"
                        className="campos-cartao"
                        required
                    />

                    <div className="container-campos-cartao">
                        <CampoTexto
                            label="Data de Validade"
                            variante="validade"
                            value={dataValidade}
                            onChange={setDataValidade}
                            placeholder="MM/AA"
                            className="campos-lado-a-lado"
                            required
                        />

                        <CampoTexto
                            label="Código de Segurança (CVV)"
                            variante="cvv"
                            value={cvv}
                            onChange={setCvv}
                            placeholder="000"
                            className="campos-lado-a-lado"
                            required
                        />
                    </div>
                </>    
            }

            <Botao
                variant="primario"
                size="md"
                className="botao-avancar"
                onClick={handleAvancar}
                disabled={incompleto}
            >
                Continuar Doação
            </Botao>
        </div>
    )
}