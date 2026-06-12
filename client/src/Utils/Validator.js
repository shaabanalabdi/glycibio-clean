export class Validator {
    static patterns = {
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/,
        // 12+ caracteres, 1 minuscule, 1 majuscule, 1 chiffre, 1 caractere special
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])\S{12,}$/
    }

    static isEmailValid(email) {
        return typeof email === "string" && this.patterns.email.test(email)
    }

    static isPasswordValid(password) {
        return typeof password === "string" && this.patterns.password.test(password)
    }

    static isNonEmptyString(value) {
        return typeof value === "string" && value.trim().length > 0
    }

    static isStringLengthValid(value, min, max) {
        return typeof value === "string" && value.trim().length >= min && value.length <= max
    }

    static isAddressValid(value, min = 10, max = 500) {
        return typeof value === "string" && value.trim().length >= min && value.length <= max
    }
}
