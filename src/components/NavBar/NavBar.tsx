import "./NavBar.css";

export default function NavBar() {
    return (
        <>
            <nav className="navbar">
                <ul>
                    <li><a href="/">Início</a></li>
                    <li><a href="/doacoes">Doar</a></li>
                    <li><a href="/historico">Histórico</a></li>
                    <li><a href="/parcerias">Parcerias</a></li>
                    <li><a href="/avaliacoes">Avaliações</a></li>
                    <li><a href="/suporte">Suporte</a></li>
                    <li><a href="/perfil">Perfil</a></li>
                </ul>
            </nav>    
        </>
    )
}