import { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import logoNpet from "../../assets/logoNpet.png";
import "./NavBar.css";

const LINKS_PRINCIPAIS = [
    { label: "Início",     href: "/" },
    { label: "Doar",       href: "/doacoes" },
    { label: "Histórico",  href: "/historico" },
    { label: "Parcerias",  href: "/parcerias" },
    { label: "Avaliações", href: "/avaliacoes" },
    { label: "Suporte",    href: "/suporte" },
];

const LINK_PERFIL = { label: "Ver Perfil", href: "/perfil" };

export default function NavBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { autenticado } = useAuth();

    const [perfilAberto, setPerfilAberto] = useState(false);
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);

    const refPerfil = useRef<HTMLLIElement>(null);

    function fecharMenus() {
        setMenuMobileAberto(false);
        setPerfilAberto(false);
    }

    function sair() {
        fecharMenus();
        navigate("/sair", { replace: true });
    }

    const isAtivo = (href: string) =>
        href === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(href);

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="navbar-logo" aria-label="Página inicial do NPET">
                    <img src={logoNpet} alt="Logo NPET" className="navbar-logo-img" />
                </Link>

                <ul className="navbar-links" role="menubar">
                    {LINKS_PRINCIPAIS.map(link => (
                        <li key={link.href} role="none">
                            <Link
                                to={link.href}
                                className={`navbar-link${isAtivo(link.href) ? " navbar-link--ativo" : ""}`}
                                role="menuitem"
                                aria-current={isAtivo(link.href) ? "page" : undefined}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <li ref={refPerfil} className="navbar-perfil-wrap" role="none">
                    {autenticado ? (
                        <>
                            <button
                                className="navbar-perfil-btn"
                                aria-haspopup="true"
                                aria-expanded={perfilAberto}
                                aria-label="Menu do usuário"
                                onClick={() => setPerfilAberto(v => !v)}
                            >
                                <span className="navbar-perfil-icone" aria-hidden="true">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#1a6e54" viewBox="0 0 256 256">
                                        <path d="M234.38,210a123.36,123.36,0,0,0-60.78-53.23,76,76,0,1,0-91.2,0A123.36,123.36,0,0,0,21.62,210a12,12,0,1,0,20.77,12c18.12-31.32,50.12-50,85.61-50s67.49,18.69,85.61,50a12,12,0,0,0,20.77-12ZM76,96a52,52,0,1,1,52,52A52.06,52.06,0,0,1,76,96Z"></path>
                                    </svg>
                                </span>
                                <svg
                                    className={`navbar-chevron${perfilAberto ? " navbar-chevron--aberto" : ""}`}
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6"
                                        strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            {perfilAberto && (
                                <ul className="navbar-dropdown navbar-dropdown--direita" role="menu" aria-label="Menu do perfil">
                                    <li role="none">
                                        <Link
                                            to={LINK_PERFIL.href}
                                            className="navbar-dropdown-item"
                                            role="menuitem"
                                            onClick={fecharMenus}
                                        >
                                            {LINK_PERFIL.label}
                                        </Link>
                                    </li>
                                    <li role="none">
                                        <button
                                            type="button"
                                            className="navbar-dropdown-item navbar-dropdown-item--sair navbar-item-botao"
                                            role="menuitem"
                                            onClick={sair}
                                        >
                                            Sair
                                        </button>
                                    </li>
                                </ul>
                            )}
                        </>
                    ) : (
                        <Link to="/login" className="navbar-link navbar-link--entrar">
                            <svg xmlns="http://www.w3.org/2000/svg" className="login-icon" width="28" height="28" fill="#e5ebe9" viewBox="0 0 256 256">
                                <path d="M141.66,133.66l-40,40A8,8,0,0,1,88,168V136H24a8,8,0,0,1,0-16H88V88a8,8,0,0,1,13.66-5.66l40,40A8,8,0,0,1,141.66,133.66ZM200,32H136a8,8,0,0,0,0,16h56V208H136a8,8,0,0,0,0,16h64a8,8,0,0,0,8-8V40A8,8,0,0,0,200,32Z"></path>
                            </svg>
                            Login
                        </Link>
                    )}
                </li>

                <button
                    className={`navbar-hamburger${menuMobileAberto ? " navbar-hamburger--aberto" : ""}`}
                    aria-label={menuMobileAberto ? "Fechar menu" : "Abrir menu"}
                    aria-expanded={menuMobileAberto}
                    aria-controls="navbar-mobile-menu"
                    onClick={() => setMenuMobileAberto(v => !v)}
                >
                    <span /><span /><span />
                </button>
            </nav>

            {menuMobileAberto && (
                <div
                    className="navbar-mobile-overlay"
                    onClick={() => setMenuMobileAberto(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                id="navbar-mobile-menu"
                className={`navbar-mobile${menuMobileAberto ? " navbar-mobile--aberto" : ""}`}
                aria-label="Menu de navegação mobile"
            >
                <ul className="navbar-mobile-links">
                    {LINKS_PRINCIPAIS.map(link => (
                        <li key={link.href}>
                            <Link
                                to={link.href}
                                className={`navbar-mobile-link${isAtivo(link.href) ? " navbar-mobile-link--ativo" : ""}`}
                                onClick={fecharMenus}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="navbar-mobile-divider" />

                <ul className="navbar-mobile-links">
                    {autenticado ? (
                        <>
                            <li>
                                <Link to={LINK_PERFIL.href} className="navbar-mobile-link" onClick={fecharMenus}>
                                    {LINK_PERFIL.label}
                                </Link>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    className="navbar-mobile-link navbar-mobile-link--sair navbar-item-botao"
                                    onClick={sair}
                                >
                                    Sair
                                </button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link to="/login" className="navbar-mobile-link" onClick={fecharMenus}>
                                    Login
                                </Link>
                            </li>
                            <li>
                                <Link to="/cadastro" className="navbar-mobile-link" onClick={fecharMenus}>
                                    Criar Conta
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </aside>
        </>
    );
}