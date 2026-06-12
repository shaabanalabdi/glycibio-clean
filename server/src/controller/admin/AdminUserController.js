import {userRepository} from "../../repository/UserRepository.js";
import {ValidationException, NotFoundException} from "../../error/HttpException.js";

const ALLOWED_ROLES = ["client", "admin"]

export class AdminUserController {

    // GET /api/admin/users
    static getUsers = async (req, res, next) => {
        try
        {
            const users = await userRepository.findAllForAdmin()

            return res.status(200).json({
                message: "Users fetched successfully",
                users
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // PUT /api/admin/users/:id/role
    static updateRole = async (req, res, next) => {
        try
        {
            const userId = parseInt(req.params.id, 10)
            const { role } = req.body

            if (Number.isNaN(userId)) {
                throw new ValidationException("ID utilisateur invalide")
            }

            if (!ALLOWED_ROLES.includes(role)) {
                throw new ValidationException(`Role invalide. Valeurs autorisees : ${ALLOWED_ROLES.join(", ")}`)
            }

            if (userId === req.user.id) {
                throw new ValidationException("Vous ne pouvez pas modifier votre propre role")
            }

            const target = await userRepository.find(userId)

            if (!target) {
                throw new NotFoundException("Utilisateur")
            }

            await userRepository.updateRole(userId, role)

            const displayName = [target.first_name, target.last_name].filter(Boolean).join(" ").trim() || target.email

            return res.status(200).json({
                message: "Role utilisateur mis a jour",
                user: { id: userId, role, display_name: displayName, email: target.email }
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // DELETE /api/admin/users/:id
    static deleteUser = async (req, res, next) => {
        try
        {
            if (parseInt(req.params.id) === req.user.id) {
                throw new ValidationException("Vous ne pouvez pas supprimer votre propre compte admin")
            }

            const deleted = await userRepository.deleteById(req.params.id)

            if (!deleted) {
                throw new NotFoundException("Utilisateur")
            }

            return res.status(200).json({ message: "Utilisateur supprime" })
        }
        catch (error)
        {
            next(error)
        }
    }
}
