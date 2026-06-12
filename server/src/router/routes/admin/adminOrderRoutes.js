import { Router } from "express"
import {AdminOrderController} from "../../../controller/admin/AdminOrderController.js";

export const adminOrderRoutes = Router()

adminOrderRoutes.get("/", AdminOrderController.getOrders)
adminOrderRoutes.put("/:id/status", AdminOrderController.updateStatus)
