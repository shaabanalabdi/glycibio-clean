// Machine à états des statuts de commande — logique PURE (sans I/O), testable
// unitairement. Sécurise le cycle de vie : empêche les transitions illogiques
// (ex. en_attente -> livree sans paiement).

export const VALID_STATUSES = [
    "en_attente", "payee", "en_preparation", "expediee", "livree", "annulee", "remboursee"
]

const STATUS_TRANSITIONS = {
    en_attente:     ["payee", "annulee"],
    payee:          ["en_preparation", "expediee", "annulee", "remboursee"],
    en_preparation: ["expediee", "annulee", "remboursee"],
    expediee:       ["livree", "remboursee"],
    livree:         ["remboursee"],
    annulee:        [],
    remboursee:     []
}

// Statut inchangé = no-op accepté. Sinon la transition doit être whitelistée.
export const isValidStatusTransition = (from, to) => {
    if (from === to) return true
    return (STATUS_TRANSITIONS[from] || []).includes(to)
}
