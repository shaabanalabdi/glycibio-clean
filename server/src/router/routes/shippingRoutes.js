import { Router } from "express"
import {ShippingController} from "../../controller/ShippingController.js";

export const shippingRoutes = Router()

shippingRoutes.get("/methods", ShippingController.getMethods)
