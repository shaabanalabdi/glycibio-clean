import { test } from "node:test"
import assert from "node:assert/strict"
import { isAdmin } from "../src/middleware/isAdmin.js"
import { ForbiddenException, UnauthorizedException } from "../src/error/HttpException.js"

// Exécute isAdmin et capture l'argument passé à next() (l'erreur, ou undefined si OK).
const runIsAdmin = (req) => {
    let captured = "UNSET"
    isAdmin(req, {}, (err) => { captured = err })
    return captured
}

test("isAdmin : refuse l'absence d'utilisateur -> 401", () => {
    const err = runIsAdmin({})
    assert.ok(err instanceof UnauthorizedException)
    assert.equal(err.status, 401)
})

test("isAdmin : refuse un rôle non-admin (client) -> 403", () => {
    const err = runIsAdmin({ user: { id: 7, role: "client" } })
    assert.ok(err instanceof ForbiddenException)
    assert.equal(err.status, 403)
})

test("isAdmin : laisse passer un admin (next sans erreur)", () => {
    const err = runIsAdmin({ user: { id: 1, role: "admin" } })
    assert.equal(err, undefined)
})
