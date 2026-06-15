import { baseApi } from "./baseApi.js"

export const orderApiSlice = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getOrders: build.query({
            query: () => ({ url: "/orders", method: "GET" }),
            transformResponse: (response) => response.orders,
            providesTags: ["orders"]
        }),
        getOrder: build.query({
            query: (id) => ({ url: `/orders/${id}`, method: "GET" }),
            transformResponse: (response) => response.order,
            providesTags: (result, error, id) => [{ type: "orders", id }]
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
    useGetOrderQuery,
    useCreateOrderMutation,
    useCancelOrderMutation
} = orderApiSlice
