import { Router } from "express"
import {CategoryController} from "../../controller/CategoryController.js";

export const categoryRoutes = Router()

categoryRoutes.get("/", CategoryController.getCategories)
