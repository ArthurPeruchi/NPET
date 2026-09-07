export default function filtroBusca(instituicoes: any[], termoBusca: string) {
    if (!termoBusca) {
        return instituicoes;
    }

    const termoBuscaLower = termoBusca.toLowerCase();

    return instituicoes.filter((instituicao) => {
        const nomeLower = instituicao.nome.toLowerCase();
        const enderecoLower = instituicao.endereco.toLowerCase();
        return (
            nomeLower.includes(termoBuscaLower) ||
            enderecoLower.includes(termoBuscaLower)
        );
    });
}