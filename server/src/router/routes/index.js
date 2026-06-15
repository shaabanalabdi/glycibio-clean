import { Router } from "express"

import { authRoutes } from "./authRoutes.js"
import { productRoutes } from "./productRoutes.js";
import { categoryRoutes } from "./categoryRoutes.js";
import { cartRoutes } from "./cartRoutes.js";
import { orderRoutes } from "./orderRoutes.js";
import { paymentRoutes } from "./paymentRoutes.js";
import { contactRoutes } from "./contactRoutes.js";
import { shippingRoutes } from "./shippingRoutes.js";
import { userRoutes } from "./userRoutes.js";
import { wishlistRoutes } from "./wishlistRoutes.js";
import { settingRoutes } from "./settingRoutes.js";

import { adminProductRoutes } from "./admin/adminProductRoutes.js";
import { adminCategoryRoutes } from "./admin/adminCategoryRoutes.js";
import { adminOrderRoutes } from "./admin/adminOrderRoutes.js";
import { adminContactRoutes } from "./admin/adminContactRoutes.js";
import { adminDashboardRoutes } from "./admin/adminDashboardRoutes.js";
import { adminUserRoutes } from "./admin/adminUserRoutes.js";
import { adminShippingRoutes } from "./admin/adminShippingRoutes.js";
import { adminReviewRoutes } from "./admin/adminReviewRoutes.js";
import { adminSettingRoutes } from "./admin/adminSettingRoutes.js";

import { isAuthenticated } from "../../middleware/isAuthenticated.js"
import { isAdmin } from "../../middleware/isAdmin.js"
import { adminLimiter } from "../../middleware/rateLimiter.js"

export const routes = Router()

// Routes publiques
routes.use("/auth", authRoutes)
routes.use("/products", productRoutes)
routes.use("/categories", categoryRoutes)
routes.use("/contact", contactRoutes)
routes.use("/shipping", shippingRoutes)
routes.use("/settings", settingRoutes)

// Routes protegees
routes.use("/cart", isAuthenticated, cartRoutes)
routes.use("/orders", isAuthenticated, orderRoutes)
routes.use("/payments", isAuthenticated, paymentRoutes)
routes.use("/users", isAuthenticated, userRoutes)
routes.use("/wishlist", isAuthenticated, wishlistRoutes)

// Routes admin (plafond de requetes dedie en plus de l'auth + isAdmin)
routes.use("/admin", adminLimiter)
routes.use("/admin/products", isAuthenticated, isAdmin, adminProductRoutes)
routes.use("/admin/categories", isAuthenticated, isAdmin, adminCategoryRoutes)
routes.use("/admin/orders", isAuthenticated, isAdmin, adminOrderRoutes)
routes.use("/admin/contacts", isAuthenticated, isAdmin, adminContactRoutes)
routes.use("/admin/dashboard", isAuthenticated, isAdmin, adminDashboardRoutes)
routes.use("/admin/users", isAuthenticated, isAdmin, adminUserRoutes)
routes.use("/admin/shipping", isAuthenticated, isAdmin, adminShippingRoutes)
routes.use("/admin/reviews", isAuthenticated, isAdmin, adminReviewRoutes)
routes.use("/admin/settings", isAuthenticated, isAdmin, adminSettingRoutes)
