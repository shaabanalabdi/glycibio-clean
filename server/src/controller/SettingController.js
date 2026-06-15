import {settingRepository} from "../repository/SettingRepository.js";

export class SettingController {

    // GET /api/settings — parametres publics du site (ex: image de fond du hero).
    static getPublic = async (req, res, next) => {
        try
        {
            const settings = await settingRepository.getPublic()
            return res.status(200).json({ message: "Settings fetched successfully", settings })
        }
        catch (error)
        {
            next(error)
        }
    }
}
