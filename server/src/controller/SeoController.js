import {productRepository} from "../repository/ProductRepository.js";

const STATIC_PATHS = [
    { loc: "/", changefreq: "daily", priority: "1.0" },
    { loc: "/catalogue", changefreq: "daily", priority: "0.9" },
    { loc: "/a-propos", changefreq: "monthly", priority: "0.6" },
    { loc: "/contact", changefreq: "monthly", priority: "0.5" },
    { loc: "/mentions-legales", changefreq: "yearly", priority: "0.3" },
    { loc: "/cgv", changefreq: "yearly", priority: "0.3" },
    { loc: "/politique-confidentialite", changefreq: "yearly", priority: "0.3" },
    { loc: "/cookies", changefreq: "yearly", priority: "0.3" },
    { loc: "/formulaire-retractation", changefreq: "yearly", priority: "0.2" }
]

const escapeXml = (s) =>
    String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" }[c]))

export class SeoController {

    // GET /sitemap.xml — sitemap dynamique (pages statiques + produits actifs)
    static getSitemap = async (req, res, next) => {
        try
        {
            const base = (process.env.PUBLIC_BASE_URL || "https://glycibio.fr").replace(/\/$/, "")
            const today = new Date().toISOString().slice(0, 10)

            const products = await productRepository.findActiveForSitemap()

            const urls = [
                ...STATIC_PATHS.map((p) => ({ loc: `${base}${p.loc}`, lastmod: today, changefreq: p.changefreq, priority: p.priority })),
                ...products.map((p) => ({
                    loc: `${base}/produit/${p.slug || p.id}`,
                    lastmod: new Date(p.updated_at).toISOString().slice(0, 10),
                    changefreq: "weekly",
                    priority: "0.8"
                }))
            ]

            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
        .map(
            (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
        )
        .join("\n")}
</urlset>`

            res.setHeader("Content-Type", "application/xml; charset=utf-8")
            res.setHeader("Cache-Control", "public, max-age=3600")
            return res.send(xml)
        }
        catch (error)
        {
            next(error)
        }
    }
}
