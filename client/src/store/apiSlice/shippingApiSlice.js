import { baseApi } from "./baseApi.js"

export const shippingApiSlice = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getShippingMethods: build.query({
            query: () => ({ url: "/shipping/methods", method: "GET" }),
            transformResponse: (response) => response.methods,
            providesTags: ["methods"]
        })
    })
})

export const { useGetShippingMethodsQuery } = shippingApiSlice
