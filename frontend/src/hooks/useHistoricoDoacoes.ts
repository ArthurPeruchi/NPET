import { useEffect, useState } from "react";
import type { DoacaoRegistrada } from "../types/domain";
import { list_donation_history, mark_feedback_seen, set_donation_recurrence } from "../services/doacoesService";

export default function useHistoricoDoacoes() {
    const [doacoes, setDoacoes] = useState<DoacaoRegistrada[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        let ativo = true;
        list_donation_history()
            .then(dados => { if (ativo) setDoacoes(dados); })
            .catch(e => { if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar o histórico."); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    async function set_recurrence(donation_id: number, recorrente: boolean) {
        await set_donation_recurrence(donation_id, recorrente);
        setDoacoes(list =>
            list.map(d => (d.id === donation_id && d.tipoDoacao === "monetaria" ? { ...d, recorrente } : d))
        );
    }

    async function see_feedback(donation_id: number) {
        await mark_feedback_seen(donation_id);
        setDoacoes(list => list.map(d => (d.id === donation_id ? { ...d, feedbackVisto: true } : d)));
    }

    return { doacoes, carregando, erro, set_recurrence, see_feedback };
}