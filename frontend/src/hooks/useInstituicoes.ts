import { useEffect, useState } from "react";
import type { Instituicao } from "../types/domain";
import { listarInstituicoes } from "../services/instituicoesService";

export default function useInstituicoes() {
    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        let ativo = true;
        listarInstituicoes()
            .then(dados => { if (ativo) setInstituicoes(dados); })
            .catch(e => { if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar instituições."); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, []);

    return { instituicoes, carregando, erro };
}
