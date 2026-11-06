import type { DadosDoacaoMonetaria, FormaPagamento } from "../../../../../types/domain";
import MenuDropdown, { type OpcaoDropdown } from "../../../../../components/MenuDropdown/MenuDropdown";
import CampoTexto from "../../../../../components/CampoTexto/CampoTexto";
import Botao from "../../../../../components/Botao/Botao";
import { IconePix, IconeCartaoCredito } from "../../../../../components/IconePagamento/IconePagamento";
import { useState } from "react";
import "./EtapaDetalhesMonetaria.css"

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

// Reexibe no campo o valor já salvo (quando o usuário volta da confirmação).
function formatarValorSalvo(valor?: number): string {
    return valor ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "";
}

export default function EtapaDetalhesMonetaria({ dados, onAvancar }: EtapaDetalhesMonetariaProps) {
    const [valorDoacao, setValorDoacao] = useState<string>(() => formatarValorSalvo(dados.valor));
    const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | null>(dados.formaPagamento ?? null);
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
    
        if (Object.keys(novosErros).length > 0 || !formaPagamento) {
            return;
        }

        const cartaoFinal = formaPagamento === "cartao_credito" 
            ? numeroCartao.replace(/\D/g, "").slice(-4) 
            : undefined;
    
        onAvancar({
            tipoDoacao: "monetaria",
            idInstituicao: dados.idInstituicao,
            valor,
            formaPagamento,
            recorrente: dados.recorrente ?? false,
            cartaoFinal,    
        });
    
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