import { Router } from "express"
import {WishlistController} from "../../controller/WishlistController.js";

export const wishlistRoutes = Router()

wishlistRoutes.get("/", WishlistController.getWishlist)
wishlistRoutes.get("/ids", WishlistController.getWishlistIds)
wishlistRoutes.post("/", WishlistController.addToWishlist)
wishlistRoutes.delete("/:product_id", WishlistController.removeFromWishlist)
