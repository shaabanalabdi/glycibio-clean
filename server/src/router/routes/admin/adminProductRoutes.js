import { Router } from "express"
import {AdminProductController} from "../../../controller/admin/AdminProductController.js";
import {AdminGalleryController} from "../../../controller/admin/AdminGalleryController.js";
import {handleUpload} from "../../../middleware/upload.js";

export const adminProductRoutes = Router()

adminProductRoutes.get("/", AdminProductController.getProducts)
adminProductRoutes.get("/:id", AdminProductController.getProduct)
adminProductRoutes.post("/", handleUpload, AdminProductController.createProduct)
adminProductRoutes.put("/:id", handleUpload, AdminProductController.updateProduct)
adminProductRoutes.delete("/:id", AdminProductController.deleteProduct)
adminProductRoutes.delete("/:id/permanent", AdminProductController.permanentDeleteProduct)

// Galerie multi-images
adminProductRoutes.get("/:id/images", AdminGalleryController.getGallery)
adminProductRoutes.post("/:id/images", handleUpload, AdminGalleryController.addImage)
adminProductRoutes.delete("/:productId/images/:imageId", AdminGalleryController.deleteImage)
