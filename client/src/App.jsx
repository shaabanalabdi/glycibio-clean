import { AppRouter } from "./AppRouter.jsx"
import { Navbar } from "@components/Navbar/index.jsx"
import { Footer } from "@components/Footer/index.jsx"
import { CookieBanner } from "@components/CookieBanner/index.jsx"
import { ErrorBoundary } from "@components/ErrorBoundary/index.jsx"
import { CartAnnouncer } from "@components/CartAnnouncer/index.jsx"
import { TopProgressBar } from "@components/TopProgressBar/index.jsx"
import { Toaster } from "@components/Toaster/index.jsx"

// Coque applicative (style pokedex) : le chrome persiste autour des routes.
// Le Provider Redux et le BrowserRouter vivent dans main.jsx.
function App() {
    return (
        <ErrorBoundary>
            <a href="#main-content" className="sr-only-focusable">
                Aller au contenu principal
            </a>
            <TopProgressBar />
            <CartAnnouncer />
            <Navbar />
            <main id="main-content" className="main-content">
                <AppRouter />
            </main>
            <Footer />
            <CookieBanner />
            <Toaster />
        </ErrorBoundary>
    )
}

export default App
