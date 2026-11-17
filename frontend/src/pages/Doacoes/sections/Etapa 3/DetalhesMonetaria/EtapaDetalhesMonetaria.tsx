import type { DadosDoacaoMonetaria, FormaPagamento } from "../../../../../types/domain";
import MenuDropdown, { type OpcaoDropdown } from "../../../../../components/MenuDropdown/MenuDropdown";
import CampoTexto from "../../../../../components/CampoTexto/CampoTexto";
import Botao from "../../../../../components/Botao/Botao";
import { IconePix, IconeCartaoCredito } from "../../../../../components/IconePagamento/IconePagamento";
import { useState } from "react";
import TaxaMercadoPago from "../../../../../components/TaxaMercadoPago/TaxaMercadoPago";
import usePerfil from "../../../../../hooks/usePerfil";
import useCartaoSeguro, { ID_CAMPO_CVV, ID_CAMPO_NUMERO, ID_CAMPO_VALIDADE } from "../../../../../hooks/useCartaoSeguro";
import { format_cpf } from "../../../../../utils/formatacao";
import "./EtapaDetalhesMonetaria.css"

const OPCOES_PAGAMENTO: OpcaoDropdown<FormaPagamento>[] = [
    { valor: "pix", label: "PIX", icone: <IconePix /> },
    { valor: "cartao_credito", label: "Cartão de Crédito", icone: <IconeCartaoCredito /> },
];

const CPF_LENGTH = 11;

function only_digits(raw: string): string {
    return raw.replace(/\D/g, "");
}

export type EtapaDetalhesMonetariaProps = {
    dados: DadosDoacaoMonetaria;
    onAvancar: (detalhes: DadosDoacaoMonetaria) => void;
    aviso?: string; // ex.: motivo da recusa do cartão, quando o usuário volta da confirmação
}

type ErrosFormulario = {
    valorDoacao?: string;
    formaPagamento?: string;
    nomeCartao?: string;
    cpfTitular?: string;
    cartao?: string;
};

// Reexibe no campo o valor já salvo (quando o usuário volta da confirmação).
function formatarValorSalvo(valor?: number): string {
    return valor ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "";
}

// Campo de cartão seguro: a caixa é nossa, mas o conteúdo é um iframe do Mercado Pago.
function CampoSeguroCartao({ label, container_id, className }: { label: string; container_id: string; className?: string }) {
    return (
        <div className={`campo-texto ${className ?? ""}`}>
            <fieldset className="campo-texto-fieldset">
                <legend className="campo-texto-legend">{label}</legend>
                <div id={container_id} className="campo-seguro-container" />
            </fieldset>
        </div>
    );
}

export default function EtapaDetalhesMonetaria({ dados, onAvancar, aviso }: EtapaDetalhesMonetariaProps) {
    const [valorDoacao, setValorDoacao] = useState<string>(() => formatarValorSalvo(dados.valor));
    const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | null>(dados.formaPagamento ?? null);
    const [nomeCartao, setNomeCartao] = useState<string>("");
    const [cpfEditado, setCpfEditado] = useState<string | null>(null); // null = ainda não editado
    const [erros, setErros] = useState<ErrosFormulario>({});
    const [gerandoToken, setGerandoToken] = useState<boolean>(false);

    const cartao = formaPagamento === "cartao_credito";

    // O CPF do titular começa com o do perfil do usuário, se houver.
    const { perfil } = usePerfil();
    const cpfTitular = cpfEditado ?? format_cpf(perfil?.cpf ?? "");

    // Os campos seguros só são montados quando o cartão está selecionado.
    const { pronto, erro_sdk, create_token } = useCartaoSeguro(cartao);

    // A taxa só aparece com um valor válido e a forma de pagamento escolhida (e acompanha o que o usuário digita).
    const valor_digitado = converterParaNumero(valorDoacao);
    const mostrar_taxa = formaPagamento !== null && valor_digitado >= 1 && valor_digitado <= 10000;

    const incompleto = !valorDoacao || !formaPagamento
        || (cartao && (!nomeCartao.trim() || only_digits(cpfTitular).length < CPF_LENGTH || !pronto));

    function converterParaNumero(valor: string): number {
        return Number(
            valor
                .replace("R$", "")
                .replace(/\./g, "")
                .replace(",", ".")
                .trim()
        ) || 0;
    }

    async function handleAvancar() {
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

        if (cartao && only_digits(cpfTitular).length !== CPF_LENGTH) {
            novosErros.cpfTitular = "Informe o CPF completo do titular do cartão.";
        }

        setErros(novosErros);

        if (Object.keys(novosErros).length > 0 || !formaPagamento) {
            return;
        }

        if (!cartao) {
            onAvancar({
                tipoDoacao: "monetaria",
                idInstituicao: dados.idInstituicao,
                valor,
                formaPagamento,
                recorrente: dados.recorrente ?? false,
            });
            return;
        }

        // Cartão: o Mercado Pago lê os campos seguros e devolve um token de uso único.
        setGerandoToken(true);
        try {
            const token = await create_token({ nome: nomeCartao.trim(), cpf: only_digits(cpfTitular) });

            onAvancar({
                tipoDoacao: "monetaria",
                idInstituicao: dados.idInstituicao,
                valor,
                formaPagamento,
                recorrente: dados.recorrente ?? false,
                cardToken: token.cardToken,
                paymentMethodId: token.paymentMethodId,
                cartaoFinal: token.cartaoFinal,
            });
        } catch (e) {
            setErros({ cartao: e instanceof Error ? e.message : "Não foi possível validar o cartão." });
        } finally {
            setGerandoToken(false);
        }
    }

    return (
        <div className="detalhes-monetaria">
            <h2>Vamos preparar sua doação?</h2>
            <p className="subtitulo">Defina o valor que deseja doar e selecione a forma de pagamento.</p>

            {aviso && <p className="detalhes-aviso" role="alert">{aviso}</p>}

            <CampoTexto
                label="Valor da Doação"
                variante="valor"
                className="campos-cartao"
                value={valorDoacao}
                onChange={setValorDoacao}
                placeholder="R$ 0,00"
                erro={erros.valorDoacao}
                complemento={mostrar_taxa ? <TaxaMercadoPago valor={valor_digitado} forma_pagamento={formaPagamento} /> : undefined}
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

            {cartao &&
                <>
                    <CampoSeguroCartao label="Número do Cartão" container_id={ID_CAMPO_NUMERO} className="campos-cartao" />

                    <CampoTexto
                        label="Nome no Cartão"
                        variante="texto"
                        value={nomeCartao}
                        onChange={setNomeCartao}
                        placeholder="Nome impresso no cartão"
                        className="campos-cartao"
                        erro={erros.nomeCartao}
                        autoComplete="cc-name"
                        required
                    />

                    <div className="container-campos-cartao">
                        <CampoSeguroCartao label="Data de Validade" container_id={ID_CAMPO_VALIDADE} className="campos-lado-a-lado" />
                        <CampoSeguroCartao label="CVV" container_id={ID_CAMPO_CVV} className="campos-lado-a-lado" />
                    </div>

                    <CampoTexto
                        label="CPF do Titular"
                        variante="texto"
                        value={cpfTitular}
                        onChange={valor => setCpfEditado(format_cpf(valor))}
                        placeholder="000.000.000-00"
                        className="campos-cartao"
                        erro={erros.cpfTitular}
                        autoComplete="off"
                        required
                    />

                    {(erros.cartao || erro_sdk) && (
                        <p className="detalhes-aviso" role="alert">{erros.cartao ?? erro_sdk}</p>
                    )}

                    <p className="detalhes-seguranca">
                        Os dados do cartão são digitados em campos seguros do Mercado Pago e nunca passam pelos servidores do NPET.
                    </p>
                </>
            }

            <Botao
                variant="primario"
                size="md"
                className="botao-avancar"
                onClick={() => void handleAvancar()}
                disabled={incompleto || gerandoToken}
            >
                {gerandoToken ? "Validando cartão..." : "Continuar Doação"}
            </Botao>
        </div>
    )
}