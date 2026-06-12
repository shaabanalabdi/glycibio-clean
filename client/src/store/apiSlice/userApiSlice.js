import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQuery } from "./baseQuery.js"

export const userApiSlice = createApi({
    reducerPath: "userApi",
    baseQuery,
    tagTypes: ["profile"],
    endpoints: (build) => ({
        getProfile: build.query({
            query: () => ({ url: "/users/me", method: "GET" }),
            transformResponse: (response) => response.user,
            providesTags: ["profile"]
        }),
        updateProfile: build.mutation({
            query: (data) => ({
                url: "/users/profile",
                method: "PUT",
                body: data
            }),
            invalidatesTags: ["profile"]
        }),
        changePassword: build.mutation({
            query: (data) => ({
                url: "/users/password",
                method: "PUT",
                body: data
            })
        }),
        deleteAccount: build.mutation({
            query: (data) => ({
                url: "/users/account",
                method: "DELETE",
                body: data
            })
        })
    })
})

export const {
    useGetProfileQuery,
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useDeleteAccountMutation
} = userApiSlice
