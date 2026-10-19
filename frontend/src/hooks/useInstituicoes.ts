import { useEffect, useState } from "react";
import type { Instituicao } from "../types/domain";
import { listarInstituicoes } from "../services/instituicoesService";

export default function useInstituicoes(habilitado: boolean = true) {
    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
    const [carregando, setCarregando] = useState(habilitado);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        if (!habilitado) return;

        let ativo = true;
        listarInstituicoes()
            .then(dados => { if (ativo) setInstituicoes(dados); })
            .catch(e => { if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar instituições."); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, [habilitado]);

    if (!habilitado) return { instituicoes: [] as Instituicao[], carregando: false, erro: null };

    return { instituicoes, carregando, erro };
}
