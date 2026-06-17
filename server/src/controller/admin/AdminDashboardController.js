import {orderRepository} from "../../repository/OrderRepository.js";
import {productRepository} from "../../repository/ProductRepository.js";

export class AdminDashboardController {

    // GET /api/admin/dashboard
    static getDashboard = async (req, res, next) => {
        try
        {
            const kpi = await orderRepository.getDashboardKpi()
            const topProducts = await productRepository.findTopProducts()
            const recentOrders = await orderRepository.findRecentWithCustomer()

            return res.status(200).json({
                message: "Dashboard fetched successfully",
                dashboard: { kpi, topProducts, recentOrders }
            })
        }
        catch (error)
        {
            next(error)
        }
    }
}
