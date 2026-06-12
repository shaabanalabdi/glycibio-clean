import { Router } from "express"
import {AdminShippingController} from "../../../controller/admin/AdminShippingController.js";

export const adminShippingRoutes = Router()

adminShippingRoutes.get("/", AdminShippingController.getShippingMethods)
adminShippingRoutes.post("/", AdminShippingController.createShippingMethod)
adminShippingRoutes.put("/:id", AdminShippingController.updateShippingMethod)
adminShippingRoutes.delete("/:id", AdminShippingController.deleteShippingMethod)
