import { Router } from "express"
import {ProductController} from "../../controller/ProductController.js";
import {ReviewController} from "../../controller/ReviewController.js";
import {isAuthenticated} from "../../middleware/isAuthenticated.js";

export const productRoutes = Router()

productRoutes.get("/", ProductController.getProducts)
productRoutes.get("/:id/related", ProductController.getRelatedProducts)
productRoutes.get("/:id/reviews", ReviewController.getProductReviews)
productRoutes.post("/:id/reviews", isAuthenticated, ReviewController.createReview)
productRoutes.get("/:id", ProductController.getProduct)
