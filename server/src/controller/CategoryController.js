import {categoryRepository} from "../repository/CategoryRepository.js";

export class CategoryController {

    // GET /api/categories
    static getCategories = async (req, res, next) => {
        try
        {
            const categories = await categoryRepository.findAll()

            // Catégories rarement modifiées : cache public 10 min.
            res.set("Cache-Control", "public, max-age=600")
            return res.status(200).json({
                message: "Categories fetched successfully",
                categories
            })
        }
        catch (error)
        {
            next(error)
        }
    }
}
