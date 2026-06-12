import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQuery } from "./baseQuery.js"

export const wishlistApiSlice = createApi({
    reducerPath: "wishlistApi",
    baseQuery,
    tagTypes: ["wishlist"],
    endpoints: (build) => ({
        getWishlist: build.query({
            query: () => ({ url: "/wishlist", method: "GET" }),
            transformResponse: (response) => response.wishlist,
            providesTags: ["wishlist"]
        }),
        getWishlistIds: build.query({
            query: () => ({ url: "/wishlist/ids", method: "GET" }),
            transformResponse: (response) => response.ids,
            providesTags: ["wishlist"]
        }),
        addToWishlist: build.mutation({
            query: (productId) => ({
                url: "/wishlist",
                method: "POST",
                body: { product_id: productId }
            }),
            invalidatesTags: ["wishlist"]
        }),
        removeFromWishlist: build.mutation({
            query: (productId) => ({
                url: `/wishlist/${productId}`,
                method: "DELETE"
            }),
            invalidatesTags: ["wishlist"]
        })
    })
})

export const {
    useGetWishlistQuery,
    useGetWishlistIdsQuery,
    useAddToWishlistMutation,
    useRemoveFromWishlistMutation
} = wishlistApiSlice
