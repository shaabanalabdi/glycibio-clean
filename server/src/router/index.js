import { Router } from "express"

import { routes } from "./routes/index.js"

export const router = Router()

// Health check
router.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "GlyciBio API fonctionne !" })
})

router.use("/", routes)
