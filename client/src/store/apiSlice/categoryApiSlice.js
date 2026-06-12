import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQuery } from "./baseQuery.js"

export const categoryApiSlice = createApi({
    reducerPath: "categoryApi",
    baseQuery,
    tagTypes: ["categories"],
    endpoints: (build) => ({
        getCategories: build.query({
            query: () => ({ url: "/categories", method: "GET" }),
            transformResponse: (response) => response.categories,
            providesTags: ["categories"]
        })
    })
})

export const { useGetCategoriesQuery } = categoryApiSlice
