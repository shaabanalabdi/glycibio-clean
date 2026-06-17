import { baseApi } from "./baseApi.js"

export const orderApiSlice = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getOrders: build.query({
            query: () => ({ url: "/orders", method: "GET" }),
            transformResponse: (response) => response.orders,
            providesTags: ["orders"]
        }),
        createOrder: build.mutation({
            query: (data) => ({
                url: "/orders",
                method: "POST",
                body: data
            }),
            invalidatesTags: ["orders"]
        }),
        cancelOrder: build.mutation({
            query: (id) => ({
                url: `/orders/${id}/cancel`,
                method: "PUT"
            }),
            invalidatesTags: ["orders"]
        })
    })
})

export const {
    useGetOrdersQuery,
    useCreateOrderMutation,
    useCancelOrderMutation
} = orderApiSlice
