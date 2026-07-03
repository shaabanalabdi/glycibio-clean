// ============================================================
// Politique de mot de passe fort — regles declaratives (regex), partagees par
// l'inscription et la reinitialisation. Chaque regle est une expression
// reguliere testee sur la saisie, pour un retour visuel EN DIRECT.
//
// Miroir exact de la validation serveur (server/src/services/Validator.js) :
//   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])\S{12,}$/
// La validation cote client ameliore l'UX ; la validation FAIT AUTORITE cote
// serveur (Validator.isPasswordValid). Ceci n'est qu'un guide visuel.
// ============================================================

export const PASSWORD_RULES = [
    { key: "length",  label: "Au moins 12 caractères (sans espace)", test: (p) => /^\S{12,}$/.test(p) },
    { key: "upper",   label: "Une majuscule (A-Z)",    test: (p) => /[A-Z]/.test(p) },
    { key: "lower",   label: "Une minuscule (a-z)",    test: (p) => /[a-z]/.test(p) },
    { key: "digit",   label: "Un chiffre (0-9)",       test: (p) => /\d/.test(p) },
    { key: "special", label: "Un caractère spécial",   test: (p) => /[^a-zA-Z0-9]/.test(p) },
]

// Etat de CHAQUE regle pour une saisie donnee : [{ key, label, ok }] (retour visuel).
export const checkPassword = (password = "") =>
    PASSWORD_RULES.map((rule) => ({ key: rule.key, label: rule.label, ok: rule.test(password) }))

// Vrai si TOUTES les regles passent (la validation finale reste cote serveur).
export const isPasswordStrong = (password = "") =>
    PASSWORD_RULES.every((rule) => rule.test(password))
