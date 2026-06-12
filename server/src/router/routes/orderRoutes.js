import { Router } from "express"
import {OrderController} from "../../controller/OrderController.js";

export const orderRoutes = Router()

orderRoutes.post("/", OrderController.createOrder)
orderRoutes.get("/", OrderController.getOrders)
orderRoutes.get("/:id", OrderController.getOrder)
orderRoutes.put("/:id/cancel", OrderController.cancelOrder)
