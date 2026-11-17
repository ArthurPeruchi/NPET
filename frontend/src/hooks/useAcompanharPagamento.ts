import { useEffect, useState } from "react";
import type { StatusDoacao } from "../types/domain";
import { get_donation } from "../services/doacoesService";

const POLLING_INTERVAL_MS = 5000;

export default function useAcompanharPagamento(donation_id: number | null, ativo: boolean): StatusDoacao | null {
    const [status, setStatus] = useState<StatusDoacao | null>(null);

    useEffect(() => {
        if (!ativo || donation_id === null) return;

        let vivo = true;

        async function check() {
            try {
                const donation = await get_donation(donation_id as number);
                if (!vivo) return;
                setStatus(donation.status);
                if (donation.status !== "pendente") window.clearInterval(timer);
            } catch {
                // Falha momentânea: tenta de novo no próximo ciclo.
            }
        }

        const timer = window.setInterval(() => void check(), POLLING_INTERVAL_MS);

        return () => {
            vivo = false;
            window.clearInterval(timer);
        };
    }, [donation_id, ativo]);

    return status;
}