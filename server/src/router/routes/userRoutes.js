import { Router } from "express"
import {UserController} from "../../controller/UserController.js";

export const userRoutes = Router()

userRoutes.get("/me", UserController.getProfile)
userRoutes.put("/profile", UserController.updateProfile)
userRoutes.put("/password", UserController.changePassword)
userRoutes.delete("/account", UserController.deleteAccount)
userRoutes.get("/me/export", UserController.exportData)
