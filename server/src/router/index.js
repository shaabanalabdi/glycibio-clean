import { Router } from "express"

import { routes } from "./routes/index.js"
import { db } from "../core/database.js"

export const router = Router()

// Liveness : le process repond-il ? (pas de dependance externe)
// Sert a detecter un event-loop fige -> redemarrage par l'orchestrateur.
router.get("/health/live", (req, res) => {
    res.status(200).json({ status: "OK", check: "live" })
})

// Readiness : l'API peut-elle reellement servir des requetes ? -> ping BDD.
// `/health` (alias historique cible par le HEALTHCHECK Docker et l'uptime
// monitor) est volontairement la sonde PROFONDE : si MySQL est injoignable, on
// renvoie 503 pour que l'orchestrateur cesse d'y router le trafic, au lieu de
// declarer "OK" pendant que toutes les requetes data echouent en 500.
const readiness = async (req, res) => {
    try
    {
        await db.query("SELECT 1")
        res.status(200).json({ status: "OK", db: "up" })
    }
    catch (error)
    {
        res.status(503).json({ status: "SERVICE_UNAVAILABLE", db: "down" })
    }
}

router.get("/health", readiness)
router.get("/health/ready", readiness)

router.use("/", routes)
