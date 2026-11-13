// Mantém só os dígitos e limita o tamanho
function keep_digits(raw: string, max_length: number): string {
    return raw.replace(/\D/g, "").slice(0, max_length);
}

// CPF no formato 000.000.000-00 (aceita digitação parcial).
export function format_cpf(raw: string): string {
    const digits = keep_digits(raw, 11);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

// Telefone no formato (00) 00000-0000 (aceita digitação parcial).
export function format_phone(raw: string): string {
    const digits = keep_digits(raw, 11);

    if (digits.length === 0) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}