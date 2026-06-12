import {shippingMethodRepository} from "../repository/ShippingMethodRepository.js";

export class ShippingController {

    // GET /api/shipping/methods
    static getMethods = async (req, res, next) => {
        try
        {
            const methods = await shippingMethodRepository.findActive()

            return res.status(200).json({
                message: "Shipping methods fetched successfully",
                methods
            })
        }
        catch (error)
        {
            next(error)
        }
    }
}
