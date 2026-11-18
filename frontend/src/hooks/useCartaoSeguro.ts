import { useEffect, useRef, useState } from "react";
import {
    get_mercado_pago,
    type CampoSeguro,
    type EstiloCampoSeguro,
    type InstanciaMercadoPago,
} from "../services/mercadoPagoService";

// Ids das divs onde o Mercado Pago monta os campos seguros.
export const ID_CAMPO_NUMERO = "mp-campo-numero";
export const ID_CAMPO_VALIDADE = "mp-campo-validade";
export const ID_CAMPO_CVV = "mp-campo-cvv";

const BIN_LENGTH = 6;

const ESTILO_CAMPO: EstiloCampoSeguro = {
    color: "#454545",
    placeholderColor: "#D9D9D9",
    fontFamily: "Roboto, sans-serif",
    fontSize: "16px",
};

export interface DadosTitular {
    nome: string;
    cpf: string;
}

export interface CartaoTokenizado {
    cardToken: string;
    paymentMethodId: string;
    cartaoFinal?: string;
}

// Monta os campos seguros enquanto `ativo` for verdadeiro e gera o token do cartão.
export default function useCartaoSeguro(ativo: boolean) {
    const [pronto, setPronto] = useState(false);
    const [erro_sdk, setErroSdk] = useState<string | null>(null);

    const mp_ref = useRef<InstanciaMercadoPago | null>(null);
    const metodo_ref = useRef<string | null>(null);
    const ultimo_bin_ref = useRef<string>("");

    useEffect(() => {
        if (!ativo) return;

        let montado = true;
        const campos: CampoSeguro[] = [];

        get_mercado_pago()
            .then(mp => {
                if (!montado) return;
                mp_ref.current = mp;

                const numero = mp.fields.create("cardNumber", { placeholder: "0000 0000 0000 0000", style: ESTILO_CAMPO }).mount(ID_CAMPO_NUMERO);
                const validade = mp.fields.create("expirationDate", { placeholder: "MM/AA", style: ESTILO_CAMPO }).mount(ID_CAMPO_VALIDADE);
                const cvv = mp.fields.create("securityCode", { placeholder: "000", style: ESTILO_CAMPO }).mount(ID_CAMPO_CVV);
                campos.push(numero, validade, cvv);

                // Os 6 primeiros dígitos (BIN) identificam a bandeira do cartão.
                numero.on("binChange", async ({ bin }) => {
                    ultimo_bin_ref.current = bin ?? "";

                    if (!bin || bin.length < BIN_LENGTH) {
                        metodo_ref.current = null;
                        return;
                    }

                    try {
                        const { results } = await mp.getPaymentMethods({ bin });
                        // Ignora a resposta se o usuário já mudou o número nesse meio tempo.
                        if (ultimo_bin_ref.current === bin) metodo_ref.current = results[0]?.id ?? null;
                    } catch {
                        if (ultimo_bin_ref.current === bin) metodo_ref.current = null;
                    }
                });

                setErroSdk(null);
                setPronto(true);
            })
            .catch(e => {
                if (montado) setErroSdk(e instanceof Error ? e.message : "Pagamento com cartão indisponível no momento.");
            });

        return () => {
            montado = false;
            campos.forEach(campo => campo.unmount?.());
            [ID_CAMPO_NUMERO, ID_CAMPO_VALIDADE, ID_CAMPO_CVV].forEach(id => {
                const container = document.getElementById(id);
                if (container) container.innerHTML = "";
            });
            metodo_ref.current = null;
            ultimo_bin_ref.current = "";
            setPronto(false);
        };
    }, [ativo]);

    // Token de uso único: vale para uma tentativa de pagamento.
    async function create_token(titular: DadosTitular): Promise<CartaoTokenizado> {
        const mp = mp_ref.current;
        if (!mp || !pronto) throw new Error("Os campos do cartão ainda estão carregando. Aguarde um instante.");

        if (!metodo_ref.current) {
            throw new Error("Não foi possível identificar a bandeira do cartão. Confira o número.");
        }

        try {
            const token = await mp.fields.createCardToken({
                cardholderName: titular.nome,
                identificationType: "CPF",
                identificationNumber: titular.cpf,
            });

            return {
                cardToken: token.id,
                paymentMethodId: metodo_ref.current,
                cartaoFinal: token.last_four_digits,
            };
        } catch {
            throw new Error("Não foi possível validar o cartão. Confira os dados e tente novamente.");
        }
    }

    return { pronto, erro_sdk, create_token };
}