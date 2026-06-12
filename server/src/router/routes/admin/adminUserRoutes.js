import { Router } from "express"
import {AdminUserController} from "../../../controller/admin/AdminUserController.js";

export const adminUserRoutes = Router()

adminUserRoutes.get("/", AdminUserController.getUsers)
adminUserRoutes.put("/:id/role", AdminUserController.updateRole)
adminUserRoutes.delete("/:id", AdminUserController.deleteUser)
