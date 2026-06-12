import { Router } from "express"
import {SeoController} from "../../controller/SeoController.js";

// Monte a la racine "/" dans App.js (pas de prefixe /api)
export const seoRoutes = Router()

seoRoutes.get("/sitemap.xml", SeoController.getSitemap)
