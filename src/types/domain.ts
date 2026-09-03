export interface RedesSociais {
    facebook?: string;
    instagram?: string;
    email?: string;
    linkedin?: string;
    whatsapp?: string;
    site?: string;
}

export interface Instituicao {
    id: number;
    nome: string;
    logo?: string;
    cidade: string;
    uf: string;
    cnpj?: string;
    animaisSobCuidado?: number;
    horarioFuncionamento?: string;
    descricao?: string;
    principaisNecessidades?: string;
    aceitaVoluntarios?: boolean;
    endereco?: string;
    redesSociais?: RedesSociais;
    aceitaDoacoes: boolean;
}