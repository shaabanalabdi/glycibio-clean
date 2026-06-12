export class Validator {
    static patterns = {
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/,
        // 12+ caracteres, 1 minuscule, 1 majuscule, 1 chiffre, 1 caractere special
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])\S{12,}$/
    }

    static isEmailValid(email) {
        return typeof email === "string" && email.length <= 255 && this.patterns.email.test(email)
    }

    static isPasswordValid(password) {
        return typeof password === "string" && this.patterns.password.test(password)
    }

    static isNonEmptyString(value) {
        return typeof value === "string" && value.trim().length > 0
    }

    // Champ optionnel : vide / null / undefined accepte, sinon chaine bornee
    static isNameValid(value, max = 100) {
        if (value === undefined || value === null || value === "") return true
        return typeof value === "string" && value.length <= max
    }

    static isStringLengthValid(value, min, max) {
        return typeof value === "string" && value.trim().length >= min && value.length <= max
    }

    static isIdValid(value) {
        const parsed = Number(value)
        return Number.isInteger(parsed) && parsed > 0
    }

    static isQuantityValid(value) {
        const parsed = Number(value)
        return Number.isInteger(parsed) && parsed >= 1
    }

    static isAddressValid(value, min = 10, max = 500) {
        return typeof value === "string" && value.trim().length >= min && value.length <= max
    }

    static isPhoneValid(value, max = 30) {
        if (value === undefined || value === null || value === "") return true
        return typeof value === "string" && value.length <= max
    }

    static isPriceValid(value) {
        const parsed = Number(value)
        return !Number.isNaN(parsed) && parsed > 0
    }

    static isStockValid(value) {
        const parsed = Number(value)
        return Number.isInteger(parsed) && parsed >= 0
    }

    static isGlycemicIndexValid(value) {
        if (value === undefined || value === null || value === "") return true
        const parsed = Number(value)
        return Number.isInteger(parsed) && parsed >= 0 && parsed <= 110
    }

    // Accepte un tableau natif OU une chaine JSON (formulaires multipart)
    static isJsonOrArray(value) {
        if (value === undefined || value === null || value === "") return true
        if (Array.isArray(value) || typeof value === "object") return true
        if (typeof value !== "string") return false
        try
        {
            JSON.parse(value)
            return true
        }
        catch
        {
            return false
        }
    }

    // Honeypot anti-bot : le champ cache doit rester vide
    static isHoneypotEmpty(value) {
        return !value || String(value).trim().length === 0
    }
}
