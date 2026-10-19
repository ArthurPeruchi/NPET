import { useState, useRef, useEffect, type ReactNode } from "react";
import "./MenuDropdown.css";

export type OpcaoDropdown<T extends string = string> = {
    valor: T;
    label: string;
    icone?: ReactNode;
};

type MenuDropdownProps<T extends string = string> = {
    label: string;
    opcoes: OpcaoDropdown<T>[];
    value?: T | null;
    onChange: (valor: T) => void;
    placeholder?: string;
    disabled?: boolean;
    erro?: string;
    id?: string;
    className?: string;
};

function Chevron({ aberto }: { aberto: boolean }) {
    return (
        <svg
            className={`dropdown-chevron ${aberto ? "dropdown-chevron--aberto" : ""}`}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M3 6l5 5 5-5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function MenuDropdown<T extends string = string>({
    label,
    opcoes,
    value = null,
    onChange,
    placeholder = "Selecione uma opção",
    disabled = false,
    erro,
    id,
    className = "",
}: MenuDropdownProps<T>) {
    const [aberto, setAberto] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);
    const campoId = id ?? `dropdown-${label.toLowerCase().replace(/\s+/g, "-")}`;

    const opcaoSelecionada = opcoes.find(o => o.valor === value) ?? null;

    useEffect(() => {
        if (!aberto) return;
        function handleClickFora(e: MouseEvent) {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setAberto(false);
            }
        }
        document.addEventListener("mousedown", handleClickFora);
        return () => document.removeEventListener("mousedown", handleClickFora);
    }, [aberto]);

    useEffect(() => {
        if (!aberto) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") setAberto(false);
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [aberto]);

    function handleSelecionar(opcao: OpcaoDropdown<T>) {
        onChange(opcao.valor);
        setAberto(false);
    }

    function handleToggle() {
        if (!disabled) setAberto(v => !v);
    }

    const classesCampo = [
        "campo-dropdown",
        aberto ? "campo-dropdown--aberto" : "",
        erro ? "campo-dropdown--erro" : "",
        disabled ? "campo-dropdown--disabled" : "",
        className,
    ].filter(Boolean).join(" ");

    return (
        <div className={classesCampo} ref={wrapRef}>
            <fieldset className="campo-dropdown-fieldset">
                <legend className="campo-dropdown-legend">{label}</legend>

                <button
                    type="button"
                    id={campoId}
                    className="campo-dropdown-trigger"
                    onClick={handleToggle}
                    disabled={disabled}
                    aria-haspopup="listbox"
                    aria-expanded={aberto}
                    aria-labelledby={`${campoId}-legend`}
                    aria-invalid={!!erro}
                    aria-describedby={erro ? `${campoId}-erro` : undefined}
                >
                    <span className="campo-dropdown-trigger-conteudo">
                        {opcaoSelecionada?.icone && (
                            <span className="campo-dropdown-icone" aria-hidden="true">
                                {opcaoSelecionada.icone}
                            </span>
                        )}
                        <span className={opcaoSelecionada ? "" : "campo-dropdown-placeholder"}>
                            {opcaoSelecionada?.label ?? placeholder}
                        </span>
                    </span>

                    <Chevron aberto={aberto} />
                </button>

                {aberto && (
                    <>
                        <div className="campo-dropdown-divisor" aria-hidden="true" />
                        <ul
                            className="campo-dropdown-lista"
                            role="listbox"
                            aria-label={label}
                        >
                            {opcoes.map(opcao => {
                                const selecionada = opcao.valor === value;
                                return (
                                    <li
                                        key={opcao.valor}
                                        role="option"
                                        aria-selected={selecionada}
                                        className={`campo-dropdown-opcao ${selecionada ? "campo-dropdown-opcao--selecionada" : ""}`}
                                        onClick={() => handleSelecionar(opcao)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                handleSelecionar(opcao);
                                            }
                                        }}
                                        tabIndex={0}
                                    >
                                        {opcao.icone && (
                                            <span className="campo-dropdown-icone" aria-hidden="true">
                                                {opcao.icone}
                                            </span>
                                        )}
                                        <span className="campo-dropdown-opcao-label">
                                            {opcao.label}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}
            </fieldset>

            {erro && (
                <p id={`${campoId}-erro`} className="campo-dropdown-erro" role="alert">
                    {erro}
                </p>
            )}
        </div>
    );
}