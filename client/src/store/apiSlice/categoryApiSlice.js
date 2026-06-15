import { baseApi } from "./baseApi.js"

export const categoryApiSlice = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getCategories: build.query({
            query: () => ({ url: "/categories", method: "GET" }),
            transformResponse: (response) => response.categories,
            providesTags: ["categories"]
        })
    })
})

export const { useGetCategoriesQuery } = categoryApiSlice
