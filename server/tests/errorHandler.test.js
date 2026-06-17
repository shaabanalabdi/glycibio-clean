import { test } from "node:test"
import assert from "node:assert/strict"
import { errorHandler } from "../src/middleware/errorHandler.js"
import { ValidationException, NotFoundException } from "../src/error/HttpException.js"

const makeReqRes = () => {
    const req = { method: "GET", originalUrl: "/api/x", path: "/api/x", headers: {} }
    const res = { statusCode: null, body: null }
    res.status = (code) => { res.statusCode = code; return res }
    res.json = (body) => { res.body = body; return res }
    return { req, res }
}

test("errorHandler : ValidationException -> 400 + message + errors", () => {
    const { req, res } = makeReqRes()
    errorHandler(new ValidationException("Champ requis", { email: "invalide" }), req, res, () => {})
    assert.equal(res.statusCode, 400)
    assert.equal(res.body.message, "Champ requis")
    assert.deepEqual(res.body.errors, { email: "invalide" })
})

test("errorHandler : NotFoundException -> 404", () => {
    const { req, res } = makeReqRes()
    errorHandler(new NotFoundException("Produit"), req, res, () => {})
    assert.equal(res.statusCode, 404)
})

test("errorHandler : erreur générique -> 500 + structure standard", () => {
    const { req, res } = makeReqRes()
    errorHandler(new Error("boom"), req, res, () => {})
    assert.equal(res.statusCode, 500)
    assert.equal(res.body.status, 500)
    assert.ok(res.body.path)
    assert.ok(res.body.timestamp)
})
