import {orderRepository} from "../../repository/OrderRepository.js";
import {productRepository} from "../../repository/ProductRepository.js";

// Construit un tableau de 30 jours (J-29 -> aujourd'hui) avec un revenu
// a 0 pour les jours sans commande (les jours vides doivent etre visibles
// sur le graphique).
const buildRevenueSeries = (rows) => {
    const byDate = new Map(rows.map((r) => [r.date, Number(r.revenue)]))
    const series = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 29; i >= 0; i -= 1) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        series.push({
            date: key,
            revenue: byDate.get(key) || 0
        })
    }
    return series
}

export class AdminDashboardController {

    // GET /api/admin/dashboard
    static getDashboard = async (req, res, next) => {
        try
        {
            const kpi = await orderRepository.getDashboardKpi()
            const topProducts = await productRepository.findTopProducts()
            const recentOrders = await orderRepository.findRecentWithCustomer()

            // Chiffre d'affaires par jour, 30 derniers jours (commandes facturables)
            const revenueRows = await orderRepository.revenueByDay()
            const revenue30d = buildRevenueSeries(revenueRows)

            return res.status(200).json({
                message: "Dashboard fetched successfully",
                dashboard: { kpi, topProducts, recentOrders, revenue30d }
            })
        }
        catch (error)
        {
            next(error)
        }
    }
}
