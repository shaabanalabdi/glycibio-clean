import cookieParser from "cookie-parser"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import * as dotenv from "dotenv"
import express from "express"
import path from "node:path"
import {fileURLToPath} from "node:url"
import {errorHandler} from "./middleware/errorHandler.js";
import {globalLimiter} from "./middleware/rateLimiter.js";
import {router} from "./router/index.js";
import {seoRoutes} from "./router/routes/seoRoutes.js";
import {webhookRoutes} from "./router/routes/webhookRoutes.js";

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const {
    NODE_ENV,
    TRUST_PROXY,
    CORS_ORIGIN
} = process.env

// En production on n'autorise QUE les origines configurees (CORS_ORIGIN) ;
// les origines de developpement (localhost) ne sont ajoutees qu'hors production.
const DEFAULT_DEV_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174"
]

const configuredOrigins = (CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

const allowedOrigins = new Set(
    NODE_ENV === "production"
        ? configuredOrigins
        : [...configuredOrigins, ...DEFAULT_DEV_ORIGINS]
)

const app = express()

// Derriere un reverse-proxy (Nginx), faire confiance au 1er hop pour que le
// rate-limiter et req.ip voient la vraie IP cliente (X-Forwarded-For).
app.set("trust proxy", Number(TRUST_PROXY) || 0)

// Helmet : headers de securite (XSS, clickjacking, MIME sniffing...).
// CORP en cross-origin pour servir les images /uploads au client Vite.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))

// Compression gzip/brotli des reponses
app.use(compression())

app.use(cors({
    origin(origin, callback) {
        // Autoriser les requetes serveur-a-serveur sans header Origin.
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true)
            return
        }
        callback(new Error(`Origin non autorisee: ${origin}`))
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

// Rate Limiting global : 300 requetes/minute par IP (garde-fou anti-abus,
// au-dessus des limites par zone — cf. rateLimiter.js)
app.use("/api/", globalLimiter)

// Webhook Stripe (doit etre AVANT express.json() — necessite le raw body)
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes)

// Parser JSON (limite 10kb contre les gros payloads malveillants) + cookies
app.use(express.json({ limit: "10kb" }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Fichiers uploades (images produits)
const isProd = NODE_ENV === "production"
app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"), {
        maxAge: isProd ? "30d" : "0",
        immutable: isProd
    })
)

// SEO (sitemap.xml — servi a la racine, sans prefixe /api)
app.use("/", seoRoutes)

// API
app.use("/api", router)

// 404
app.use((req, res) => {
    res.status(404).json({
        status: 404,
        message: `Route ${req.method} ${req.originalUrl} non trouvee`,
        path: req.path,
        timestamp: new Date().toISOString()
    })
})

// Gestionnaire global des erreurs (doit etre en dernier)
app.use(errorHandler)

export { app }
export default app
