import { baseApi } from "./baseApi.js"

export const contactApiSlice = baseApi.injectEndpoints({
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
