import { Router } from "express"
import {AdminSettingController} from "../../../controller/admin/AdminSettingController.js";
import {handleUpload} from "../../../middleware/upload.js";

export const adminSettingRoutes = Router()

// Image de fond du hero : upload (multipart) + reinitialisation.
adminSettingRoutes.put("/hero-background", handleUpload, AdminSettingController.updateHeroBackground)
adminSettingRoutes.delete("/hero-background", AdminSettingController.resetHeroBackground)

// Contenu texte du hero (titre, accroche, boutons, garanties) — JSON.
adminSettingRoutes.put("/hero-content", AdminSettingController.updateHeroContent)
