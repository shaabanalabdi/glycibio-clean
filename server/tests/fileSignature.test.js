import { test } from "node:test"
import assert from "node:assert/strict"
import { FileSignature } from "../src/services/FileSignature.js"

const pad12 = (bytes) => {
    const b = Buffer.alloc(12)
    Buffer.from(bytes).copy(b)
    return b
}

test("detecte un vrai JPEG (FF D8 FF)", () => {
    assert.equal(FileSignature.detectImageType(pad12([0xff, 0xd8, 0xff, 0xe0])), "jpeg")
})

test("detecte un vrai PNG", () => {
    assert.equal(FileSignature.detectImageType(pad12([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "png")
})

test("detecte un vrai WebP (RIFF....WEBP)", () => {
    assert.equal(FileSignature.detectImageType(
        Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])
    ), "webp")
})

test("rejette un contenu non-image (ex: texte / SVG / PDF)", () => {
    // "<svg ..." -> stored XSS potentiel : DOIT etre rejete
    assert.equal(FileSignature.detectImageType(Buffer.from("<svg xmlns=...")), null)
    assert.equal(FileSignature.detectImageType(Buffer.from("%PDF-1.4 ....")), null)
    assert.equal(FileSignature.isAllowedImage(Buffer.from("<svg>")), false)
})

test("rejette un buffer trop court ou non-buffer", () => {
    assert.equal(FileSignature.detectImageType(Buffer.from([0xff, 0xd8])), null)
    assert.equal(FileSignature.detectImageType(null), null)
    assert.equal(FileSignature.detectImageType("pas un buffer"), null)
})

test("isAllowedImage : vrai uniquement pour jpeg/png/webp", () => {
    assert.equal(FileSignature.isAllowedImage(pad12([0xff, 0xd8, 0xff])), true)
    assert.equal(FileSignature.isAllowedImage(pad12([0x00, 0x01, 0x02])), false)
})
