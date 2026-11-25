import { useCallback, useEffect, useRef, useState } from "react";
import { ACTIVITY_EVENT } from "./atividade";

export const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;
export const INACTIVITY_WARNING_MS = 3 * 60 * 1000; // o aviso aparece quando faltam 3 minutos
const CHECK_INTERVAL_MS = 1000;

// A última atividade é compartilhada entre abas: quem está usando o site em outra aba mantém a sessão viva.
const SHARED_ACTIVITY_KEY = "npet_ultima_atividade";
const SHARED_WRITE_THROTTLE_MS = 5000;

const USER_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"] as const;

function read_shared_activity(): number {
    try {
        return Number(localStorage.getItem(SHARED_ACTIVITY_KEY)) || 0;
    } catch {
        return 0;
    }
}

export default function useInatividade(ativo: boolean, on_timeout: () => void) {
    const [segundos_restantes, set_segundos_restantes] = useState<number | null>(null);
    const last_activity_ref = useRef(0);
    const last_write_ref = useRef(0);
    const on_timeout_ref = useRef(on_timeout);

    useEffect(() => {
        on_timeout_ref.current = on_timeout;
    }, [on_timeout]);

    const registrar_atividade = useCallback(() => {
        const now = Date.now();
        last_activity_ref.current = now;

        if (now - last_write_ref.current >= SHARED_WRITE_THROTTLE_MS) {
            last_write_ref.current = now;
            try {
                localStorage.setItem(SHARED_ACTIVITY_KEY, String(now));
            } catch {
                // Sem localStorage, a contagem vale só para esta aba.
            }
        }
    }, []);

    const continuar = useCallback(() => {
        registrar_atividade();
        set_segundos_restantes(null);
    }, [registrar_atividade]);

    useEffect(() => {
        if (!ativo) return;

        registrar_atividade();

        for (const name of USER_EVENTS) window.addEventListener(name, registrar_atividade, { passive: true });
        window.addEventListener(ACTIVITY_EVENT, registrar_atividade);

        // Compara com o relógio a cada segundo
        const timer_id = window.setInterval(() => {
            const last_activity = Math.max(last_activity_ref.current, read_shared_activity());
            const remaining_ms = INACTIVITY_LIMIT_MS - (Date.now() - last_activity);

            if (remaining_ms <= 0) {
                window.clearInterval(timer_id);
                on_timeout_ref.current();
                return;
            }

            set_segundos_restantes(remaining_ms <= INACTIVITY_WARNING_MS ? Math.ceil(remaining_ms / 1000) : null);
        }, CHECK_INTERVAL_MS);

        return () => {
            for (const name of USER_EVENTS) window.removeEventListener(name, registrar_atividade);
            window.removeEventListener(ACTIVITY_EVENT, registrar_atividade);
            window.clearInterval(timer_id);
            set_segundos_restantes(null);
        };
    }, [ativo, registrar_atividade]);

    return { segundos_restantes, continuar };
}