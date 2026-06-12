import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQuery } from "./baseQuery.js"

export const shippingApiSlice = createApi({
    reducerPath: "shippingApi",
    baseQuery,
    tagTypes: ["methods"],
    endpoints: (build) => ({
        getShippingMethods: build.query({
            query: () => ({ url: "/shipping/methods", method: "GET" }),
            transformResponse: (response) => response.methods,
            providesTags: ["methods"]
        })
    })
})

export const { useGetShippingMethodsQuery } = shippingApiSlice
