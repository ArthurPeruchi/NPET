import { useEffect, useState } from "react";
import type { DoacaoRegistrada } from "../types/domain";
import { list_donation_history, mark_feedback_seen, set_donation_recurrence } from "../services/doacoesService";

// PIX que ainda consta como pendente, mas cujo prazo de pagamento já passou, é exibido como cancelado.
function mark_expired_pix(donations: DoacaoRegistrada[]): DoacaoRegistrada[] {
    const now = Date.now();

    return donations.map(donation => {
        const expira_em = donation.tipoDoacao === "monetaria" ? donation.pix?.expiraEm : undefined;
        const expirada = donation.status === "pendente" && expira_em !== undefined && new Date(expira_em).getTime() <= now;

        return expirada ? { ...donation, status: "cancelada" } : donation;
    });
}

export default function useHistoricoDoacoes() {
    const [doacoes, setDoacoes] = useState<DoacaoRegistrada[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        let ativo = true;
        list_donation_history()
            .then(dados => { if (ativo) setDoacoes(mark_expired_pix(dados)); })
            .catch(e => { if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar o histórico."); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    function replace_donation(updated: DoacaoRegistrada) {
        setDoacoes(list => list.map(d => (d.id === updated.id ? updated : d)));
    }

    async function reload() {
        try {
            setDoacoes(mark_expired_pix(await list_donation_history()));
        } catch {
            // Mantém a lista atual; o próximo acesso ao histórico tenta de novo.
        }
    }

    async function set_recurrence(donation_id: number, recorrente: boolean) {
        replace_donation(await set_donation_recurrence(donation_id, recorrente));
    }

    async function see_feedback(donation_id: number) {
        replace_donation(await mark_feedback_seen(donation_id));
    }

    return { doacoes, carregando, erro, reload, set_recurrence, see_feedback };
}