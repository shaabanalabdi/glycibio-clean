import {categoryRepository} from "../repository/CategoryRepository.js";

export class CategoryController {

    // GET /api/categories
    static getCategories = async (req, res, next) => {
        try
        {
            const categories = await categoryRepository.findAll()

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
