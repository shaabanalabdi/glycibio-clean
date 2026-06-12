import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQuery } from "./baseQuery.js"

export const authApiSlice = createApi({
    reducerPath: "authApi",
    baseQuery,
    tagTypes: ["authUser"],
    endpoints: (build) => ({
        register: build.mutation({
            query: (data) => ({
                url: "/auth/register",
                method: "POST",
                body: data
            }),
            invalidatesTags: ["authUser"]
        }),
        login: build.mutation({
            query: (credentials) => ({
                url: "/auth/login",
                method: "POST",
                body: credentials
            }),
            invalidatesTags: ["authUser"]
        }),
        logout: build.mutation({
            query: () => ({
                url: "/auth/logout",
                method: "POST"
            }),
            invalidatesTags: ["authUser"]
        }),
        getAuthenticatedUser: build.query({
            query: () => ({ url: "/auth/me", method: "GET" }),
            transformResponse: (response) => response.user,
            providesTags: ["authUser"]
        }),
        forgotPassword: build.mutation({
            query: (data) => ({
                url: "/auth/forgot-password",
                method: "POST",
                body: data
            })
        }),
        resetPassword: build.mutation({
            query: (data) => ({
                url: "/auth/reset-password",
                method: "POST",
                body: data
            })
        })
    })
})

export const {
    useRegisterMutation,
    useLoginMutation,
    useLogoutMutation,
    useGetAuthenticatedUserQuery,
    useForgotPasswordMutation,
    useResetPasswordMutation
} = authApiSlice
