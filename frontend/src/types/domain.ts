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
    cnpj?: string;
    cidade: string;
    uf: string;
    endereco?: string;
    animaisSobCuidado?: number;
    horarioFuncionamento?: string;
    descricao?: string;
    aceitaVoluntarios?: boolean;
    aceitaDoacoes: boolean;
    redesSociais?: RedesSociais;
    necessidades?: Necessidade[];
}

export interface Necessidade {
    id: number;
    nome: string;
    descricao?: string;
    prioridade: PrioridadeNecessidade;
    quantidadeMeta?: number;
    unidade?: UnidadeMedida;
}

/* ============================================
   |    Interfaces para doações concluídas    |
   ============================================ */

export interface Doacao {
    id: number;
    idUsuario: number;
    idInstituicao: number;
    tipoDoacao: TipoDoacao;
    status: StatusDoacao;
    feedback?: string;
}

export interface ItemDoacaoProduto {
    id: number;
    nome: string;
    descricao?: string;
    // marca?: string;
    // especie?: "cachorro" | "gato" | "outro";
    // faseVida?: "filhote" | "adulto" | "idoso" | "todas";
    // peso?: number;
    quantidade: number;
    unidade?: UnidadeMedida;
}

export interface Visita {
    id: number;
    idDoacao: number;
    data: string;
    horario: string;
}

export interface DoacaoMonetaria extends Doacao {
    tipoDoacao: "monetaria";
    valor: number;
    formaPagamento: FormaPagamento;
    recorrente: boolean;
}

export interface DoacaoProdutoBase extends Doacao {
    tipoDoacao: "produto";
    itens: ItemDoacaoProduto[];
}

export interface DoacaoProdutoVisita extends DoacaoProdutoBase {
    formaEntrega: "visita";
    visita: Visita;
}

export interface DoacaoProdutoParceiro extends DoacaoProdutoBase {
    formaEntrega: "compra_parceiro";
}

/* ============================================
   |   Interfaces para doações em andamento   |
   ============================================ */

export interface DadosDoacaoBase {
    idInstituicao: number | null;
}

export interface DadosDoacaoMonetaria extends DadosDoacaoBase {
    tipoDoacao: "monetaria";
    valor?: number;
    formaPagamento?: FormaPagamento;
    recorrente?: boolean;
}

export interface DadosDoacaoProduto extends DadosDoacaoBase {
    tipoDoacao: "produto";
    itens?: ItemDoacaoProduto[];
    formaEntrega?: FormaEntrega;
    visita?: Omit<Visita, "id" | "idDoacao">;
}

/* ============================================
   |   Tipos e enums utilizados no projeto    |
   ============================================ */

export type TipoUsuario = "administrador" | "instituicao" | "doador";
export type TipoDoacao = "monetaria" | "produto";
export type StatusDoacao = "pendente" | "confirmada" | "cancelada";
export type PrioridadeNecessidade = "alta" | "media" | "baixa";
export type UnidadeMedida = "unidade" | "kg" | "g" | "l" | "ml" | "caixa" | "pacote" | "outro";
export type FormaPagamento = "pix" | "cartao_credito";
export type FormaEntrega = "visita" | "compra_parceiro";
export type DadosDoacao = DadosDoacaoBase | DadosDoacaoMonetaria | DadosDoacaoProduto;