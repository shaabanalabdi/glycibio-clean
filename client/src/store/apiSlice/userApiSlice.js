import { baseApi } from "./baseApi.js"

export const userApiSlice = baseApi.injectEndpoints({
    endpoints: (build) => ({
        updateProfile: build.mutation({
            query: (data) => ({
                url: "/users/profile",
                method: "PUT",
                body: data
            }),
            // "authUser" en plus de "profile" : l'app lit l'utilisateur courant
            // (nom, adresse, telephone) via /auth/me (tag "authUser", cf.
            // useAuthenticated). Sans invalider ce tag, l'adresse est bien
            // enregistree en base mais l'UI (pre-remplissage Profil/Checkout)
            // garde l'ancienne valeur en cache -> l'utilisateur croit que ca n'a
            // pas ete sauvegarde.
            invalidatesTags: ["profile", "authUser"]
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
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useDeleteAccountMutation
} = userApiSlice
