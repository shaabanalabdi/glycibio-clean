import { test } from "node:test"
import assert from "node:assert/strict"
import { csrfProtection } from "../src/middleware/csrf.js"

const makeRes = () => {
    const res = { statusCode: null, body: null, cookies: [] }
    res.cookie = (name, value) => { res.cookies.push([name, value]); return res }
    res.status = (code) => { res.statusCode = code; return res }
    res.json = (body) => { res.body = body; return res }
    return res
}

const run = (req) => {
    const res = makeRes()
    let nextCalled = false
    csrfProtection(req, res, () => { nextCalled = true })
    return { res, nextCalled }
}

test("CSRF : méthode sûre (GET) passe + dépose un cookie si absent", () => {
    const { res, nextCalled } = run({ method: "GET", headers: {} })
    assert.equal(nextCalled, true)
    assert.equal(res.statusCode, null)
    assert.equal(res.cookies.length, 1)        // csrf_token émis
})

test("CSRF : POST sans en-tête X-CSRF-Token -> 403", () => {
    const { res, nextCalled } = run({ method: "POST", headers: { cookie: "csrf_token=abc123" } })
    assert.equal(nextCalled, false)
    assert.equal(res.statusCode, 403)
})

test("CSRF : POST avec en-tête == cookie -> passe", () => {
    const { res, nextCalled } = run({
        method: "POST",
        headers: { cookie: "csrf_token=abc123", "x-csrf-token": "abc123" }
    })
    assert.equal(nextCalled, true)
    assert.equal(res.statusCode, null)
})

test("CSRF : POST avec en-tête != cookie -> 403", () => {
    const { res, nextCalled } = run({
        method: "POST",
        headers: { cookie: "csrf_token=abc123", "x-csrf-token": "WRONG" }
    })
    assert.equal(nextCalled, false)
    assert.equal(res.statusCode, 403)
})
