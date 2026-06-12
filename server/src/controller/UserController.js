import bcrypt from "bcrypt";
import {userRepository} from "../repository/UserRepository.js";
import {orderRepository} from "../repository/OrderRepository.js";
import {orderItemRepository} from "../repository/OrderItemRepository.js";
import {Validator} from "../services/Validator.js";
import {
    ValidationException,
    UnauthorizedException,
    NotFoundException
} from "../error/HttpException.js";

const PASSWORD_MESSAGE = "Le mot de passe doit contenir au moins 12 caracteres dont : 1 minuscule, 1 majuscule, 1 chiffre, 1 caractere special"

const toProfile = (user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name,
    address: user.address,
    phone: user.phone,
    created_at: user.created_at
})

export class UserController {

    // GET /api/users/me — profil complet (adresse + telephone inclus)
    static getProfile = async (req, res, next) => {
        try
        {
            const user = await userRepository.find(req.user.id)

            if (!user) {
                throw new NotFoundException("Utilisateur")
            }

            return res.status(200).json({
                message: "Profile fetched successfully",
                user: toProfile(user)
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // PUT /api/users/profile
    static updateProfile = async (req, res, next) => {
        try
        {
            const { first_name, last_name, address, phone } = req.body

            const errors = {}
            if (!Validator.isNameValid(first_name)) errors.first_name = "Le prenom ne doit pas depasser 100 caracteres"
            if (!Validator.isNameValid(last_name)) errors.last_name = "Le nom ne doit pas depasser 100 caracteres"
            if (!Validator.isNameValid(address, 500)) errors.address = "L'adresse ne doit pas depasser 500 caracteres"
            if (!Validator.isPhoneValid(phone)) errors.phone = "Le telephone ne doit pas depasser 30 caracteres"

            if (Object.keys(errors).length > 0) {
                throw new ValidationException(Object.values(errors).join(", "), errors)
            }

            const user = await userRepository.updateProfile(req.user.id, { first_name, last_name, address, phone })

            return res.status(200).json({
                message: "Profil mis a jour",
                user: toProfile(user)
            })
        }
        catch (error)
        {
            next(error)
        }
    }

    // PUT /api/users/password
    static changePassword = async (req, res, next) => {
        try
        {
            const { current_password, new_password } = req.body

            if (!current_password || !new_password) {
                throw new ValidationException("current_password et new_password sont obligatoires")
            }

            if (!Validator.isPasswordValid(new_password)) {
                throw new ValidationException(PASSWORD_MESSAGE)
            }

            const user = await userRepository.find(req.user.id)

            const isValid = await bcrypt.compare(current_password, user.password)

            if (!isValid) {
                throw new UnauthorizedException("Mot de passe actuel incorrect")
            }

            const hashedPassword = await bcrypt.hash(new_password, 12)

            await userRepository.updatePassword(req.user.id, hashedPassword)

            return res.status(200).json({ message: "Mot de passe modifie avec succes" })
        }
        catch (error)
        {
            next(error)
        }
    }

    // DELETE /api/users/account
    static deleteAccount = async (req, res, next) => {
        try
        {
            const { password } = req.body

            if (!password) {
                throw new ValidationException("Le mot de passe est obligatoire pour confirmer la suppression")
            }

            const user = await userRepository.find(req.user.id)

            const isValid = await bcrypt.compare(password, user.password)

            if (!isValid) {
                throw new UnauthorizedException("Mot de passe incorrect")
            }

            await userRepository.deleteById(req.user.id)

            return res.status(200).json({ message: "Compte supprime avec succes" })
        }
        catch (error)
        {
            next(error)
        }
    }

    // GET /api/users/me/export — RGPD art. 15 (droit d'acces aux donnees)
    static exportData = async (req, res, next) => {
        try
        {
            const user = await userRepository.find(req.user.id)

            if (!user) {
                throw new NotFoundException("Utilisateur")
            }

            const orders = await orderRepository.findByUserForExport(req.user.id)
            const orderItems = await orderItemRepository.findByUserForExport(req.user.id)

            const itemsByOrder = orderItems.reduce((acc, item) => {
                (acc[item.order_id] = acc[item.order_id] || []).push(item)
                return acc
            }, {})

            const ordersWithItems = orders.map((o) => ({ ...o, items: itemsByOrder[o.id] || [] }))

            const { password: _password, reset_token: _rt, reset_token_expires: _rte, ...cleanUser } = user

            const payload = {
                exported_at: new Date().toISOString(),
                legal_basis: "RGPD article 15 - droit d acces",
                data_controller: "GlyciBio SAS",
                user: cleanUser,
                orders: ordersWithItems
            }

            res.setHeader("Content-Type", "application/json; charset=utf-8")
            res.setHeader("Content-Disposition", `attachment; filename="glycibio-export-${req.user.id}.json"`)
            return res.send(JSON.stringify(payload, null, 2))
        }
        catch (error)
        {
            next(error)
        }
    }
}
