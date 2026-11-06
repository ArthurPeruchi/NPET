// Data no formato brasileiro (DD/MM/AAAA).
export function format_date(value: string | Date): string {
    const date = typeof value === "string" ? new Date(value) : value;
    return date.toLocaleDateString("pt-BR");
}

// Soma meses mantendo o dia de origem; em meses mais curtos usa o último dia (31/01 -> 28/02).
function add_months(start: Date, months: number): Date {
    const target_month = start.getMonth() + months;
    const last_day = new Date(start.getFullYear(), target_month + 1, 0).getDate();
    return new Date(start.getFullYear(), target_month, Math.min(start.getDate(), last_day));
}

// Próxima data mensal (a partir de hoje) de uma doação recorrente criada em start_iso.
export function get_next_monthly_date(start_iso: string, now: Date = new Date()): Date {
    const start = new Date(start_iso);
    const MAX_MONTHS = 1200;

    for (let months = 1; months < MAX_MONTHS; months++) {
        const candidate = add_months(start, months);
        if (candidate > now) return candidate;
    }

    return add_months(start, MAX_MONTHS);
}