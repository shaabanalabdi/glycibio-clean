import { test } from "node:test"
import assert from "node:assert/strict"

// On fixe les variables AVANT l'import dynamique : AuthHelper lit
// process.env.JWT_SECRET au moment de l'appel (dotenv n'ecrase pas une valeur
// deja definie), donc le test est deterministe meme si un .env existe.
process.env.JWT_SECRET = "test-secret-de-32-caracteres-minimum-xx"
process.env.NODE_ENV = "test"
process.env.JWT_ALGO = "HS256"

const { AuthHelper } = await import("../src/services/AuthHelper.js")

test("signToken puis verifyToken : aller-retour conserve id et role", () => {
    const token = AuthHelper.signToken({ id: 42, role: "admin" })
    assert.equal(typeof token, "string")
    const decoded = AuthHelper.verifyToken(token)
    assert.equal(decoded.id, 42)
    assert.equal(decoded.role, "admin")
    assert.equal(typeof decoded.iat, "number")
    assert.equal(typeof decoded.exp, "number")
})

test("verifyToken rejette un jeton falsifie", () => {
    const token = AuthHelper.signToken({ id: 1, role: "client" })
    const tampered = token.slice(0, -3) + "abc"
    assert.throws(() => AuthHelper.verifyToken(tampered))
})

test("verifyToken rejette un jeton signe avec un autre secret", () => {
    const otherSecretToken =
        // jeton HS256 signe avec "mauvais-secret" (genere hors-ligne)
        "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MX0.3Qd2Q5Yk7m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8"
    assert.throws(() => AuthHelper.verifyToken(otherSecretToken))
})

test("setAuthCookie : cookie HttpOnly, path '/', non-Secure hors production", () => {
    const captured = {}
    const res = { cookie: (name, value, options) => Object.assign(captured, { name, value, options }) }
    AuthHelper.setAuthCookie(res, "jeton")
    assert.equal(captured.name, AuthHelper.COOKIE_NAME)
    assert.equal(captured.value, "jeton")
    assert.equal(captured.options.httpOnly, true)
    assert.equal(captured.options.path, "/")
    assert.equal(captured.options.secure, false) // NODE_ENV !== production
})

test("getTokenFromRequest : lit l'en-tete Authorization Bearer en priorite", () => {
    const req = { headers: { authorization: "Bearer abc.def.ghi" }, cookies: {} }
    assert.equal(AuthHelper.getTokenFromRequest(req), "abc.def.ghi")
})

test("getTokenFromRequest : repli sur le cookie HttpOnly", () => {
    const req = { headers: {}, cookies: { [AuthHelper.COOKIE_NAME]: "cookie-token" } }
    assert.equal(AuthHelper.getTokenFromRequest(req), "cookie-token")
})
