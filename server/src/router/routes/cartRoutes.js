import { Router } from "express"
import {CartController} from "../../controller/CartController.js";

export const cartRoutes = Router()

cartRoutes.get("/", CartController.getCart)
cartRoutes.post("/", CartController.addToCart)
cartRoutes.post("/merge", CartController.mergeCart)
cartRoutes.put("/:id", CartController.updateQuantity)
cartRoutes.delete("/:id", CartController.removeFromCart)
cartRoutes.delete("/", CartController.clearCart)
