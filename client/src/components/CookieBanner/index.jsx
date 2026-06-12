import "./style.scss"
import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"

const CONSENT_KEY = "glycibio_consent"
// 13 mois = duree max recommandee par la CNIL pour le renouvellement du consentement
const CONSENT_TTL_MS = 13 * 30 * 24 * 60 * 60 * 1000

const DEFAULT_PREFS = { analytics: false, marketing: false }

const readConsent = () => {
    try
    {
        const raw = localStorage.getItem(CONSENT_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== "object") return null
        if (Date.now() - (parsed.timestamp || 0) > CONSENT_TTL_MS) return null
        return parsed
    }
    catch
    {
        return null
    }
}

const writeConsent = (value) => {
    localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ ...value, timestamp: Date.now(), version: 1 })
    )
}

export const CookieBanner = () => {
    const [visible, setVisible] = useState(false)
    const [showPanel, setShowPanel] = useState(false)
    const [prefs, setPrefs] = useState(DEFAULT_PREFS)
    const dialogCloseRef = useRef(null)

    // Lecture de localStorage au mount + abonnement a un event global pour
    // ouvrir le panneau depuis le footer. Pattern "sync external system".
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture localStorage au mount (sync external)
        if (!readConsent()) setVisible(true)
        const openHandler = () => {
            const existing = readConsent()
            if (existing) setPrefs({ analytics: !!existing.analytics, marketing: !!existing.marketing })
            setVisible(true)
            setShowPanel(true)
        }
        window.addEventListener("open-cookie-preferences", openHandler)
        return () => window.removeEventListener("open-cookie-preferences", openHandler)
    }, [])

    // Focus du bouton de fermeture quand le panel s'ouvre
    useEffect(() => {
        if (showPanel && dialogCloseRef.current) dialogCloseRef.current.focus()
    }, [showPanel])

    // Esc ferme le panel detaille
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape" && showPanel) setShowPanel(false)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [showPanel])

    if (!visible) return null

    const acceptAll = () => {
        writeConsent({ analytics: true, marketing: true })
        setVisible(false)
        setShowPanel(false)
    }
    const refuseAll = () => {
        writeConsent({ analytics: false, marketing: false })
        setVisible(false)
        setShowPanel(false)
    }
    const saveCustom = () => {
        writeConsent(prefs)
        setVisible(false)
        setShowPanel(false)
    }

    return (
        <>
            {/* Banniere principale (visible si le panel detaille n'est pas ouvert) */}
            {!showPanel && (
                <div
                    className="cookie-banner"
                    role="dialog"
                    aria-modal="false"
                    aria-labelledby="cookie-banner-title"
                >
                    <div className="cookie-banner__inner">
                        <div className="cookie-banner__text">
                            <h2 id="cookie-banner-title" className="cookie-banner__title">
                                Respect de votre vie privee
                            </h2>
                            <p>
                                Nous utilisons des cookies strictement necessaires au fonctionnement du site
                                (panier, session). Avec votre accord, des cookies de mesure d&apos;audience et
                                marketing peuvent etre actives.{" "}
                                <Link to="/cookies">En savoir plus</Link>{" "}
                                -{" "}
                                <Link to="/politique-confidentialite">Politique de confidentialite</Link>.
                            </p>
                        </div>
                        <div className="cookie-banner__actions">
                            <button
                                type="button"
                                className="btn btn--outline"
                                onClick={refuseAll}
                            >
                                Tout refuser
                            </button>
                            <button
                                type="button"
                                className="btn btn--outline"
                                onClick={() => setShowPanel(true)}
                            >
                                Personnaliser
                            </button>
                            <button
                                type="button"
                                className="btn btn--outline"
                                onClick={acceptAll}
                            >
                                Tout accepter
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Panneau detaille (consentement granulaire) */}
            {showPanel && (
                <div
                    className="cookie-banner cookie-banner--panel"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cookie-panel-title"
                >
                    <div className="cookie-banner__inner">
                        <div className="cookie-banner__panel-header">
                            <h2 id="cookie-panel-title" className="cookie-banner__title">
                                Vos preferences cookies
                            </h2>
                            <button
                                ref={dialogCloseRef}
                                type="button"
                                className="cookie-banner__close"
                                onClick={() => setShowPanel(false)}
                                aria-label="Fermer la fenetre de preferences"
                            >
                                &times;
                            </button>
                        </div>

                        <fieldset className="cookie-banner__group">
                            <legend className="cookie-banner__group-title">
                                Cookies strictement necessaires
                            </legend>
                            <label className="cookie-banner__toggle cookie-banner__toggle--locked">
                                <input type="checkbox" checked disabled aria-label="Cookies necessaires (toujours actifs)" />
                                <span>Toujours actifs - panier, authentification, securite (CSRF). Indispensables.</span>
                            </label>
                        </fieldset>

                        <fieldset className="cookie-banner__group">
                            <legend className="cookie-banner__group-title">Mesure d&apos;audience</legend>
                            <label className="cookie-banner__toggle">
                                <input
                                    type="checkbox"
                                    checked={prefs.analytics}
                                    onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))}
                                />
                                <span>Statistiques anonymes pour ameliorer le site (pages vues, parcours).</span>
                            </label>
                        </fieldset>

                        <fieldset className="cookie-banner__group">
                            <legend className="cookie-banner__group-title">Marketing</legend>
                            <label className="cookie-banner__toggle">
                                <input
                                    type="checkbox"
                                    checked={prefs.marketing}
                                    onChange={(e) => setPrefs((p) => ({ ...p, marketing: e.target.checked }))}
                                />
                                <span>Cookies publicitaires personnalises (reseaux sociaux, retargeting).</span>
                            </label>
                        </fieldset>

                        <div className="cookie-banner__actions cookie-banner__actions--panel">
                            <button type="button" className="btn btn--outline" onClick={refuseAll}>
                                Tout refuser
                            </button>
                            <button type="button" className="btn btn--outline" onClick={saveCustom}>
                                Enregistrer mes choix
                            </button>
                            <button type="button" className="btn btn--outline" onClick={acceptAll}>
                                Tout accepter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
