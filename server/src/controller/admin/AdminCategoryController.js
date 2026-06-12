import {categoryRepository} from "../../repository/CategoryRepository.js";
import {Category} from "../../entity/Category.js";
import {ValidationException, NotFoundException, ConflictException} from "../../error/HttpException.js";

export class AdminCategoryController {

    // GET /api/admin/categories
    static getCategories = async (req, res, next) => {
        try
        {
            const categories = await categoryRepository.findAllWithCounts()

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

    // POST /api/admin/categories
    static createCategory = async (req, res, next) => {
        try
        {
            const { name, description } = req.body

            if (!name) {
                throw new ValidationException("Le nom de la categorie est obligatoire")
            }

            const category = new Category()
            category.name = name
            category.description = description || null

            const categoryId = await categoryRepository.save(category)

            return res.status(201).json({
                message: "Categorie creee",
                category: { id: categoryId }
            })
        }
        catch (error)
        {
            if (error.code === "ER_DUP_ENTRY") {
                return next(new ConflictException("Cette categorie existe deja"))
            }
            next(error)
        }
    }

    // PUT /api/admin/categories/:id
    static updateCategory = async (req, res, next) => {
        try
        {
            const { name, description } = req.body

            const updated = await categoryRepository.updatePartial(req.params.id, { name, description })

            if (!updated) {
                throw new NotFoundException("Categorie")
            }

            return res.status(200).json({ message: "Categorie mise a jour" })
        }
        catch (error)
        {
            if (error.code === "ER_DUP_ENTRY") {
                return next(new ConflictException("Ce nom de categorie existe deja"))
            }
            next(error)
        }
    }

    // DELETE /api/admin/categories/:id
    static deleteCategory = async (req, res, next) => {
        try
        {
            const deleted = await categoryRepository.deleteById(req.params.id)

            if (!deleted) {
                throw new NotFoundException("Categorie")
            }

            return res.status(200).json({ message: "Categorie supprimee" })
        }
        catch (error)
        {
            if (error.code === "ER_ROW_IS_REFERENCED_2") {
                return next(new ValidationException("Impossible de supprimer : des produits utilisent cette categorie"))
            }
            next(error)
        }
    }
}
