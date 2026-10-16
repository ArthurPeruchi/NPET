import { useState, useRef, type ReactNode } from "react";
import "./CampoTexto.css";

type VarianteCampo =
    | "texto"
    | "email"
    | "senha"
    | "valor"           // R$ 0,00
    | "horario"         // HH:MM
    | "data"            // DD/MM/AAAA
    | "numeroCartao"    // 0000 0000 0000 0000
    | "validade"        // MM/AA
    | "cvv"             // 000
    | "exibicao";

type CampoTextoProps = {
    label: string;
    variante?: VarianteCampo;
    placeholder?: string;
    value?: string;
    onChange?: (valor: string) => void;
    maxValor?: number;
    icone?: ReactNode;
    disabled?: boolean;
    required?: boolean;
    erro?: string;
    id?: string;
    className?: string;
    autoComplete?: string;
};

function formatarValor(raw: string, max: number): string {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";

    let numero = parseInt(digits, 10) / 100;

    numero = Math.min(max, numero);

    return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function formatarHorario(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function formatarData(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatarNumeroCartao(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 16);

    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatarValidadeCartao(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 4);

    if (digits.length <= 2) return digits;

    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatarCVV(raw: string): string {
    return raw.replace(/\D/g, "").slice(0, 3);
}

function IconeOlho({ visivel }: { visivel: boolean }) {
    return visivel ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3"
                stroke="currentColor" strokeWidth="1.8"/>
        </svg>
    ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}

export default function CampoTexto({
    label,
    variante = "texto",
    placeholder,
    value = "",
    onChange,
    maxValor,
    icone,
    disabled = false,
    required = false,
    erro,
    id,
    className = "",
    autoComplete,
}: CampoTextoProps) {
    const [senhaVisivel, setSenhaVisivel] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const campoId  = id ?? `campo-${label.toLowerCase().replace(/\s+/g, "-")}`;

    const modoExibicao = variante === "exibicao";

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (!onChange || disabled || modoExibicao) return;
        const raw = e.target.value;

        if (variante === "valor"){ 
            onChange(formatarValor(raw, maxValor ?? Infinity));   
            return; 
        }

        if (variante === "horario"){ 
            onChange(formatarHorario(raw));  
            return; 
        }

        if (variante === "data"){ 
            onChange(formatarData(raw));     
            return; 
        }

        if (variante === "numeroCartao"){ 
            onChange(formatarNumeroCartao(raw));     
            return; 
        }

        if (variante === "validade"){ 
            onChange(formatarValidadeCartao(raw));     
            return; 
        }

        if (variante === "cvv"){ 
            onChange(formatarCVV(raw));     
            return; 
        }

        onChange(raw);
    }

    const tipoInput =
        variante === "senha" ? (senhaVisivel ? "text" : "password") :
        variante === "email" ? "email" :
        variante === "valor" ? "text" :
        variante === "horario" ? "text" :
        variante === "data" ? "text" :
        "text";

    const placeholderFinal =
        placeholder ??
        (variante === "valor" ? "R$ 0,00" :
         variante === "horario" ? "HH:MM" :
         variante === "data" ? "DD/MM/AAAA" :
         variante === "email" ? "usuario@dominio.com" :
         variante === "senha" ? "••••••••" : "");

    const inputMode =
        variante === "valor" ? "numeric" :
        variante === "horario" ? "numeric" :
        variante === "data" ? "numeric" : undefined;

    const classesCampo = [
        "campo-texto",
        erro ? "campo-texto--erro" : "",
        disabled ? "campo-texto--disabled" : "",
        modoExibicao ? "campo-texto--exibicao" : "",
        className,
    ].filter(Boolean).join(" ");

    return (
        <div className={classesCampo}>
            <fieldset
                className="campo-texto-fieldset"
                onClick={() => inputRef.current?.focus()}
            >
                <legend className="campo-texto-legend">{label}</legend>

                <div className="campo-texto-inner">
                    {icone && (
                        <span className="campo-texto-icone" aria-hidden="true">
                            {icone}
                        </span>
                    )}

                    {modoExibicao ? (
                        <span
                            className="campo-texto-valor-exibicao"
                            role="text"
                            aria-label={label}
                        >
                            {value || <span className="campo-texto-placeholder">{placeholderFinal}</span>}
                        </span>
                    ) : (
                        <input
                            ref={inputRef}
                            id={campoId}
                            className="campo-texto-input"
                            type={tipoInput}
                            placeholder={placeholderFinal}
                            value={value}
                            onChange={handleChange}
                            disabled={disabled}
                            required={required}
                            aria-required={required}
                            aria-invalid={!!erro}
                            aria-describedby={erro ? `${campoId}-erro` : undefined}
                            autoComplete={autoComplete}
                            inputMode={inputMode}
                        />
                    )}

                    {variante === "senha" && !modoExibicao && (
                        <button
                            type="button"
                            className="campo-texto-toggle-senha"
                            onClick={() => setSenhaVisivel(v => !v)}
                            aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
                        >
                            <IconeOlho visivel={senhaVisivel} />
                        </button>
                    )}
                </div>
            </fieldset>

            {erro && (
                <p
                    id={`${campoId}-erro`}
                    className="campo-texto-erro"
                    role="alert"
                >
                    {erro}
                </p>
            )}
        </div>
    );
}