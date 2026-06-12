import { Router } from "express"
import {AdminDashboardController} from "../../../controller/admin/AdminDashboardController.js";

export const adminDashboardRoutes = Router()

adminDashboardRoutes.get("/", AdminDashboardController.getDashboard)
