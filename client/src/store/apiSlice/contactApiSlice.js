import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQuery } from "./baseQuery.js"

export const contactApiSlice = createApi({
    reducerPath: "contactApi",
    baseQuery,
    endpoints: (build) => ({
        sendMessage: build.mutation({
            query: (data) => ({
                url: "/contact",
                method: "POST",
                body: data
            })
        })
    })
})

export const { useSendMessageMutation } = contactApiSlice
