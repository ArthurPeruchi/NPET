import { loadMercadoPago } from "@mercadopago/sdk-js";

const PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined;

// É um iframe do Mercado Pago montado dentro de uma div do NPET (ou seja, o JavaScript do NPET não consegue ler o que é digitado nele).
export interface CampoSeguro {
    mount(container_id: string): CampoSeguro;
    unmount?: () => void;
    on(event: string, handler: (data: { bin?: string }) => void): void;
}

export type TipoCampoSeguro = "cardNumber" | "expirationDate" | "securityCode";

// Estilo aceito pelo iframe do campo seguro (nomes de propriedades CSS em camelCase).
export interface EstiloCampoSeguro {
    color?: string;
    placeholderColor?: string;
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
}

export interface TokenCartao {
    id: string;
    last_four_digits?: string;
}

export interface InstanciaMercadoPago {
    fields: {
        create(type: TipoCampoSeguro, options?: { placeholder?: string; style?: EstiloCampoSeguro }): CampoSeguro;
        createCardToken(data: {
            cardholderName: string;
            identificationType: string;
            identificationNumber: string;
        }): Promise<TokenCartao>;
    };
    getPaymentMethods(params: { bin: string }): Promise<{ results: { id: string }[] }>;
}

declare global {
    interface Window {
        MercadoPago?: new (public_key: string, options?: { locale?: string }) => InstanciaMercadoPago;
    }
}

let instancia: Promise<InstanciaMercadoPago> | null = null;

// Carrega o SDK uma única vez e reaproveita a mesma instância.
export function get_mercado_pago(): Promise<InstanciaMercadoPago> {
    if (!instancia) {
        instancia = (async () => {
            if (!PUBLIC_KEY) throw new Error("Pagamento com cartão indisponível no momento.");

            await loadMercadoPago();

            if (!window.MercadoPago) throw new Error("Pagamento com cartão indisponível no momento.");
            return new window.MercadoPago(PUBLIC_KEY, { locale: "pt-BR" });
        })().catch(error => {
            instancia = null; // permite tentar de novo se o carregamento falhou
            throw error;
        });
    }

    return instancia;
}