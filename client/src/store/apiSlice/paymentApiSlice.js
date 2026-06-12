import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQuery } from "./baseQuery.js"

export const paymentApiSlice = createApi({
    reducerPath: "paymentApi",
    baseQuery,
    endpoints: (build) => ({
        createCheckout: build.mutation({
            query: (data) => ({
                url: "/payments/create-checkout",
                method: "POST",
                body: data
            })
        }),
        confirmPayment: build.query({
            query: (sessionId) => ({
                url: "/payments/success",
                method: "GET",
                params: { session_id: sessionId }
            }),
            transformResponse: (response) => response.order
        })
    })
})

export const { useCreateCheckoutMutation, useConfirmPaymentQuery } = paymentApiSlice
