import { Router } from "express"
import {SettingController} from "../../controller/SettingController.js";

export const settingRoutes = Router()

// Public : lecture des parametres exposes au front (image de fond du hero, ...)
settingRoutes.get("/", SettingController.getPublic)
