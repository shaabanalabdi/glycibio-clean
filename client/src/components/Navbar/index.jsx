import "./style.scss"
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { ShoppingCart, User, LogOut, Menu, X, Search, Heart, Truck, Undo2, ShieldCheck } from "lucide-react";
import { useAuthenticated } from "@hooks/useAuthenticated.js";
import { useCart } from "@hooks/useCart.js";
import logo from "@app/logo/Logo.png";
import { getDisplayName } from "@utils/userDisplay";
import { ThemeToggle } from "@components/ThemeToggle/index.jsx";

export const Navbar = () => {
    const { authUser, logout, isAdmin } = useAuthenticated();
    const { cartCount, refreshCartCount } = useCart();
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const drawerCloseRef = useRef(null);
    const menuTriggerRef = useRef(null);   // burger — pour restaurer le focus a la fermeture

    useEffect(() => {
        if (authUser) refreshCartCount();
    }, [authUser, refreshCartCount]);

    // Close drawer on route change — sync route -> internal state (faux positif set-state-in-effect)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMenuOpen(false);
    }, [location.pathname, location.search]);

    // Body scroll lock while drawer is open
    useEffect(() => {
        if (typeof document === "undefined") return;
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

    // `inert` sur le reste de la page pendant que le drawer est ouvert
    // (focus trap natif, supporte par tous les navigateurs modernes).
    useEffect(() => {
        if (typeof document === "undefined") return;
        const main = document.getElementById("main-content");
        const footer = document.querySelector(".footer");
        const topBar = document.querySelector(".top-bar");
        const navRow = document.querySelector(".navbar > .navbar__container");
        const targets = [main, footer, topBar, navRow].filter(Boolean);
        if (menuOpen) {
            targets.forEach((el) => el.setAttribute("inert", ""));
        } else {
            targets.forEach((el) => el.removeAttribute("inert"));
        }
        return () => targets.forEach((el) => el.removeAttribute("inert"));
    }, [menuOpen]);

    // Escape to close
    useEffect(() => {
        const onKey = (e) => { if (e.key === "Escape") { setMenuOpen(false); menuTriggerRef.current?.focus(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Focus management
    useEffect(() => {
        if (menuOpen && drawerCloseRef.current) drawerCloseRef.current.focus();
    }, [menuOpen]);

    const submitSearch = (e) => {
        e.preventDefault();
        const q = searchQuery.trim();
        navigate(q ? `/catalogue?search=${encodeURIComponent(q)}` : "/catalogue");
    };

    // Ferme le drawer ET restaure le focus sur le burger (sauf si une
    // navigation suit : App deplace alors le focus vers <main>).
    const closeMenu = useCallback(() => {
        setMenuOpen(false);
        menuTriggerRef.current?.focus();
    }, []);

    return (
        <>
            <aside className="top-bar" aria-label="Avantages GlyciBio">
                <ul className="top-bar__rotator">
                    <li>
                        <Truck size={14} strokeWidth={2.25} aria-hidden="true" />
                        <span>Livraison gratuite d&egrave;s 49&nbsp;&euro; en France</span>
                    </li>
                    <li>
                        <Undo2 size={14} strokeWidth={2.25} aria-hidden="true" />
                        <span>Retour gratuit sous 14 jours</span>
                    </li>
                    <li>
                        <ShieldCheck size={14} strokeWidth={2.25} aria-hidden="true" />
                        <span>Paiement s&eacute;curis&eacute; Stripe</span>
                    </li>
                </ul>
            </aside>

            <nav className="navbar" aria-label="Navigation principale">
                <div className="navbar__container">
                    {/* LEFT — mobile: burger / desktop: logo */}
                    <button
                        ref={menuTriggerRef}
                        type="button"
                        className="navbar__icon-btn navbar__burger"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Ouvrir le menu"
                        aria-expanded={menuOpen}
                        aria-controls="primary-drawer"
                    >
                        <Menu size={24} strokeWidth={2} aria-hidden="true" />
                    </button>

                    <Link to="/" className="navbar__logo" aria-label="GlyciBio - accueil" viewTransition>
                        <img src={logo} alt="GlyciBio" className="navbar__logo-image" width="180" height="40" loading="eager" decoding="async" />
                    </Link>

                    {/* CENTER-LEFT — primary nav links (desktop) */}
                    <ul className="navbar__nav" role="list">
                        <li>
                            <Link
                                to="/"
                                className={`navbar__nav-link${location.pathname === "/" ? " is-active" : ""}`}
                                aria-current={location.pathname === "/" ? "page" : undefined}
                                viewTransition
                            >
                                Accueil
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/catalogue"
                                className={`navbar__nav-link${location.pathname.startsWith("/catalogue") ? " is-active" : ""}`}
                                aria-current={location.pathname.startsWith("/catalogue") ? "page" : undefined}
                                viewTransition
                            >
                                Catalogue
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/a-propos"
                                className={`navbar__nav-link${location.pathname.startsWith("/a-propos") ? " is-active" : ""}`}
                                aria-current={location.pathname.startsWith("/a-propos") ? "page" : undefined}
                                viewTransition
                            >
                                À propos
                            </Link>
                        </li>
                    </ul>

                    {/* CENTER — inline search bar (flex:1 fills space between left and right) */}
                    <form className="navbar__search" onSubmit={submitSearch} role="search" aria-label="Rechercher un produit">
                        <Search size={18} strokeWidth={2} className="navbar__search-icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="navbar__search-input"
                            placeholder="Rechercher un aliment"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Rechercher un produit"
                            autoComplete="off"
                            enterKeyHint="search"
                        />
                    </form>

                    {/* RIGHT — mobile: cart only / desktop: icons */}
                    <div className="navbar__right">
                        {authUser && isAdmin && <Link to="/admin" className="navbar__nav-link navbar__admin" viewTransition>Dashboard</Link>}

                        {authUser && (
                            <Link to="/favoris" className="navbar__icon-btn navbar__icon-btn--outlined navbar__icon-btn--desktop" aria-label="Mes favoris" title="Mes favoris" viewTransition>
                                <Heart size={22} strokeWidth={2} aria-hidden="true" />
                            </Link>
                        )}

                        <Link
                            to={authUser ? "/profil" : "/login"}
                            className="navbar__icon-btn navbar__icon-btn--outlined navbar__icon-btn--desktop"
                            aria-label={authUser ? `Mon compte (${getDisplayName(authUser)})` : "Se connecter"}
                            title={authUser ? getDisplayName(authUser) : "Se connecter"}
                            viewTransition
                        >
                            <User size={22} strokeWidth={2} aria-hidden="true" />
                        </Link>

                        {authUser && (
                            <button
                                type="button"
                                onClick={() => logout()}
                                className="navbar__icon-btn navbar__icon-btn--outlined navbar__icon-btn--desktop"
                                aria-label="Se deconnecter"
                                title="Se deconnecter"
                            >
                                <LogOut size={22} strokeWidth={2} aria-hidden="true" />
                            </button>
                        )}

                        <Link to="/panier" className="navbar__icon-btn navbar__cart" aria-label={`Panier (${cartCount} articles)`} viewTransition>
                            <ShoppingCart size={22} strokeWidth={2} aria-hidden="true" />
                            {cartCount > 0 && (
                                <span className="navbar__cart-badge" aria-hidden="true">{cartCount > 99 ? "99+" : cartCount}</span>
                            )}
                        </Link>

                        <ThemeToggle />
                    </div>
                </div>
            </nav>

            {/* Mobile drawer */}
            {/* `inert` (plutot qu'aria-hidden) quand ferme : retire le drawer de
                l'arbre d'accessibilite ET du focus. Evite l'avertissement
                "aria-hidden on a focused element" quand on ferme via un lien. */}
            <div
                className={`navbar-drawer ${menuOpen ? "is-open" : ""}`}
                inert={!menuOpen ? true : undefined}
            >
                <div className="navbar-drawer__backdrop" onClick={closeMenu} />
                <aside
                    id="primary-drawer"
                    className="navbar-drawer__panel"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menu principal"
                >
                    <div className="navbar-drawer__header">
                        <Link to="/" className="navbar-drawer__logo" onClick={closeMenu}>
                            <img src={logo} alt="GlyciBio" width="160" height="36" />
                        </Link>
                        <button
                            ref={drawerCloseRef}
                            type="button"
                            className="navbar__icon-btn"
                            onClick={closeMenu}
                            aria-label="Fermer le menu"
                        >
                            <X size={24} strokeWidth={2} aria-hidden="true" />
                        </button>
                    </div>

                    <nav className="navbar-drawer__nav" aria-label="Navigation mobile">
                        <Link to="/" onClick={closeMenu} viewTransition>Accueil</Link>
                        <Link to="/catalogue" onClick={closeMenu} viewTransition>Catalogue</Link>
                        <Link to="/a-propos" onClick={closeMenu} viewTransition>À propos</Link>
                        <Link to="/contact" onClick={closeMenu} viewTransition>Contact</Link>

                        <div className="navbar-drawer__divider" role="separator" />

                        {authUser ? (
                            <>
                                <Link to="/profil" onClick={closeMenu}><User size={18} aria-hidden="true" /> {getDisplayName(authUser)}</Link>
                                <Link to="/favoris" onClick={closeMenu}><Heart size={18} aria-hidden="true" /> Mes favoris</Link>
                                {isAdmin && (
                                    <Link to="/admin" className="navbar__admin" onClick={closeMenu}>Dashboard</Link>
                                )}
                                <button
                                    type="button"
                                    onClick={() => { logout(); closeMenu(); }}
                                    className="navbar-drawer__logout"
                                >
                                    <LogOut size={18} aria-hidden="true" /> Deconnexion
                                </button>
                            </>
                        ) : (
                            <div className="navbar-drawer__auth">
                                <Link to="/login" className="btn btn--outline" onClick={closeMenu}>Connexion</Link>
                                <Link to="/register" className="btn btn--primary" onClick={closeMenu}>Inscription</Link>
                            </div>
                        )}
                    </nav>
                </aside>
            </div>
        </>
    );
};
