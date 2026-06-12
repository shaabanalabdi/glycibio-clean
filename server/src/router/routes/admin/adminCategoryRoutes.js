import { Router } from "express"
import {AdminCategoryController} from "../../../controller/admin/AdminCategoryController.js";

export const adminCategoryRoutes = Router()

adminCategoryRoutes.get("/", AdminCategoryController.getCategories)
adminCategoryRoutes.post("/", AdminCategoryController.createCategory)
adminCategoryRoutes.put("/:id", AdminCategoryController.updateCategory)
adminCategoryRoutes.delete("/:id", AdminCategoryController.deleteCategory)
