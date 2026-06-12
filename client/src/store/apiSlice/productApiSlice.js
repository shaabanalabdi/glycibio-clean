import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQuery } from "./baseQuery.js"

export const productApiSlice = createApi({
    reducerPath: "productApi",
    baseQuery,
    tagTypes: ["products", "product", "reviews"],
    endpoints: (build) => ({
        getProducts: build.query({
            query: (params = {}) => ({
                url: "/products",
                method: "GET",
                params
            }),
            transformResponse: (response) => ({
                products: response.products,
                pagination: response.pagination
            }),
            providesTags: ["products"]
        }),
        getProduct: build.query({
            query: (id) => ({ url: `/products/${id}`, method: "GET" }),
            transformResponse: (response) => response.product,
            providesTags: (result, error, id) => [{ type: "product", id }]
        }),
        getRelatedProducts: build.query({
            query: (id) => ({ url: `/products/${id}/related`, method: "GET" }),
            transformResponse: (response) => response.products
        }),
        getProductReviews: build.query({
            query: (id) => ({ url: `/products/${id}/reviews`, method: "GET" }),
            transformResponse: (response) => ({
                reviews: response.reviews,
                count: response.count,
                average: response.average
            }),
            providesTags: (result, error, id) => [{ type: "reviews", id }]
        }),
        createReview: build.mutation({
            query: ({ productId, ...data }) => ({
                url: `/products/${productId}/reviews`,
                method: "POST",
                body: data
            }),
            invalidatesTags: (result, error, { productId }) => [{ type: "reviews", id: productId }]
        })
    })
})

export const {
    useGetProductsQuery,
    useGetProductQuery,
    useGetRelatedProductsQuery,
    useGetProductReviewsQuery,
    useCreateReviewMutation
} = productApiSlice
