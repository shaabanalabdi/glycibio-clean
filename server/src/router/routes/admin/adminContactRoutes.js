import { Router } from "express"
import {AdminContactController} from "../../../controller/admin/AdminContactController.js";

export const adminContactRoutes = Router()

adminContactRoutes.get("/", AdminContactController.getContacts)
adminContactRoutes.put("/:id/read", AdminContactController.markAsRead)
