import { Component } from "react"

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error, info) {
        // Capter via Sentry si dispo (chargement dynamique pour ne pas bloquer le bundle)
        if (typeof window !== "undefined" && window.__SENTRY__) {
            try { window.__SENTRY__.captureException?.(error, { extra: info }) } catch { /* ignore */ }
        }
        console.error("[ErrorBoundary]", error, info)
    }

    handleReload = () => {
        this.setState({ hasError: false })
        if (typeof window !== "undefined") window.location.reload()
    }

    render() {
        if (!this.state.hasError) return this.props.children

        return (
            <div className="error-boundary" role="alert">
                <h1>Une erreur inattendue est survenue</h1>
                <p>
                    Nous avons ete notifies du probleme. Vous pouvez recharger la page pour reessayer.
                </p>
                <button onClick={this.handleReload} className="btn btn--primary">
                    Recharger la page
                </button>
            </div>
        )
    }
}
