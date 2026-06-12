export class Slug {

    // Generation de slug ASCII-friendly (accents -> caracteres simples)
    static slugify = (input) => {
        if (!input || typeof input !== "string") return ""
        return input
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 120)
    }

    // Slug unique pour un produit : suffixe par son id (toujours unique)
    static productSlug = (name, id) => {
        const base = this.slugify(name)
        return `${base || "produit"}-${id}`
    }
}
