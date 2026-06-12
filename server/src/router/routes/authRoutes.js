import { Router } from "express"
import {AuthController} from "../../controller/AuthController.js";
import {isAuthenticated} from "../../middleware/isAuthenticated.js";
import {authLimiter} from "../../middleware/rateLimiter.js";

export const authRoutes = Router()

authRoutes.post("/register", authLimiter, AuthController.register)
authRoutes.post("/login", authLimiter, AuthController.signIn)
authRoutes.post("/logout", AuthController.signOut)
authRoutes.get("/me", isAuthenticated, AuthController.getAuthenticatedUser)
authRoutes.post("/forgot-password", authLimiter, AuthController.forgotPassword)
authRoutes.post("/reset-password", authLimiter, AuthController.resetPassword)
