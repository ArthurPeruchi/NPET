const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;

export function is_valid_email(email: string): boolean {
    return EMAIL_REGEX.test(email);
}

export function validate_password(password: string): string | null {
    if (!password) return "Senha é obrigatória.";

    if (password.length < PASSWORD_MIN_LENGTH)
        return `A senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres.`;

    if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES)
        return "A senha é muito longa. Use no máximo 72 caracteres.";

    if (!/[A-Z]/.test(password)) return "A senha deve conter ao menos uma letra maiúscula.";
    if (!/[a-z]/.test(password)) return "A senha deve conter ao menos uma letra minúscula.";
    if (!/\d/.test(password)) return "A senha deve conter ao menos um número.";

    return null;
}