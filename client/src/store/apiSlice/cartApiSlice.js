import { baseApi } from "./baseApi.js"

export const cartApiSlice = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getCart: build.query({
            query: () => ({ url: "/cart", method: "GET" }),
            transformResponse: (response) => response.cart,
            providesTags: ["cart"]
        }),
        addToCart: build.mutation({
            query: (item) => ({
                url: "/cart",
                method: "POST",
                body: item
            }),
            invalidatesTags: ["cart"]
        }),
        mergeCart: build.mutation({
            query: (payload) => ({
                url: "/cart/merge",
                method: "POST",
                body: payload
            }),
            invalidatesTags: ["cart"]
        }),
        updateCartItem: build.mutation({
            query: ({ id, quantity }) => ({
                url: `/cart/${id}`,
                method: "PUT",
                body: { quantity }
            }),
            invalidatesTags: ["cart"]
        }),
        removeCartItem: build.mutation({
            query: (id) => ({
                url: `/cart/${id}`,
                method: "DELETE"
            }),
            invalidatesTags: ["cart"]
        }),
        clearCart: build.mutation({
            query: () => ({
                url: "/cart",
                method: "DELETE"
            }),
            invalidatesTags: ["cart"]
        })
    })
})

export const {
    useGetCartQuery,
    useAddToCartMutation,
    useMergeCartMutation,
    useUpdateCartItemMutation,
    useRemoveCartItemMutation,
    useClearCartMutation
} = cartApiSlice
