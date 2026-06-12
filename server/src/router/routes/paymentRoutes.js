import { Router } from "express"
import {PaymentController} from "../../controller/PaymentController.js";

export const paymentRoutes = Router()

paymentRoutes.post("/create-checkout", PaymentController.createCheckout)
paymentRoutes.get("/success", PaymentController.handleSuccess)
