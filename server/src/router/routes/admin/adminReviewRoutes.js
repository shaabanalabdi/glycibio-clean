import { Router } from "express"
import {AdminReviewController} from "../../../controller/admin/AdminReviewController.js";

export const adminReviewRoutes = Router()

adminReviewRoutes.get("/", AdminReviewController.getReviews)
adminReviewRoutes.put("/:id", AdminReviewController.updateReviewStatus)
