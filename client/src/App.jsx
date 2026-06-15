import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { AppRouter } from "./AppRouter.jsx"
import { Navbar } from "@components/Navbar/index.jsx"
import { EmailVerificationBanner } from "@components/EmailVerificationBanner/index.jsx"
import { Footer } from "@components/Footer/index.jsx"
import { CookieBanner } from "@components/CookieBanner/index.jsx"
import { ErrorBoundary } from "@components/ErrorBoundary/index.jsx"
import { CartAnnouncer } from "@components/CartAnnouncer/index.jsx"
import { TopProgressBar } from "@components/TopProgressBar/index.jsx"
import { Toaster } from "@components/Toaster/index.jsx"

// Coque applicative (style pokedex) : le chrome persiste autour des routes.
// Le Provider Redux et le BrowserRouter vivent dans main.jsx.
function App() {
    const { pathname } = useLocation()
    const mainRef = useRef(null)

    // A11y : a chaque changement de route, remonter en haut et deplacer le
    // focus vers le contenu principal (annonce la nouvelle page au lecteur
    // d'ecran ; WCAG 2.4.3). main a tabIndex=-1 pour etre focusable.
    useEffect(() => {
        window.scrollTo(0, 0)
        mainRef.current?.focus({ preventScroll: true })
    }, [pathname])

    return (
        <ErrorBoundary>
            <a href="#main-content" className="sr-only-focusable">
                Aller au contenu principal
            </a>
            <TopProgressBar />
            <CartAnnouncer />
            <Navbar />
            <EmailVerificationBanner />
            <main id="main-content" className="main-content" ref={mainRef} tabIndex={-1}>
                <AppRouter />
            </main>
            <Footer />
            <CookieBanner />
            <Toaster />
        </ErrorBoundary>
    )
}

export default App
