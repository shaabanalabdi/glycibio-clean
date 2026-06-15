import { baseApi } from "./baseApi.js"

export const paymentApiSlice = baseApi.injectEndpoints({
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
