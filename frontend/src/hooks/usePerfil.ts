import { useEffect, useState } from "react";
import type { PerfilUsuario } from "../types/domain";
import { get_my_profile } from "../services/usuariosService";

export default function usePerfil() {
    const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        let ativo = true;

        get_my_profile()
            .then(dados => { if (ativo) setPerfil(dados); })
            .catch(e => { if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar o perfil."); })
            .finally(() => { if (ativo) setCarregando(false); });

        return () => { ativo = false; };
    }, []);

    return { perfil, carregando, erro, set_perfil: setPerfil };
}