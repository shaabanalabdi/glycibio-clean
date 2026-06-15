import { baseApi } from "./baseApi.js"

export const authApiSlice = baseApi.injectEndpoints({
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
        }),
        verifyEmail: build.mutation({
            query: (data) => ({
                url: "/auth/verify-email",
                method: "POST",
                body: data
            }),
            invalidatesTags: ["authUser"]
        }),
        resendVerification: build.mutation({
            query: () => ({
                url: "/auth/resend-verification",
                method: "POST"
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
    useResetPasswordMutation,
    useVerifyEmailMutation,
    useResendVerificationMutation
} = authApiSlice
