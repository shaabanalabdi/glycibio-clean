import { test } from "node:test"
import assert from "node:assert/strict"
import { Slug } from "../src/services/Slug.js"

test("slugify : minuscules, accents retires, espaces -> tirets", () => {
    assert.equal(Slug.slugify("Pâtes Complètes Bio"), "pates-completes-bio")
    assert.equal(Slug.slugify("Thé vert matcha (100g)"), "the-vert-matcha-100g")
})

test("slugify : tirets de bord supprimes, entree vide geree", () => {
    assert.equal(Slug.slugify("  -- Hello -- "), "hello")
    assert.equal(Slug.slugify(""), "")
    assert.equal(Slug.slugify(null), "")
    assert.equal(Slug.slugify(42), "")
})

test("productSlug : suffixe l'id pour garantir l'unicite", () => {
    assert.equal(Slug.productSlug("Riz basmati", 7), "riz-basmati-7")
    // nom vide -> fallback "produit-<id>"
    assert.equal(Slug.productSlug("", 9), "produit-9")
})
