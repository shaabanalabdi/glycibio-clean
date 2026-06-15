import { baseApi } from "./baseApi.js"

// Parametres de site publics (ex: image de fond du hero), injectes dans l'API
// unique. Le tag "settings" est invalide par les mutations admin -> le front
// se met a jour automatiquement apres un changement en back-office.
export const settingApiSlice = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getSettings: build.query({
            query: () => ({ url: "/settings", method: "GET" }),
            transformResponse: (response) => response.settings,
            providesTags: ["settings"]
        })
    })
})

export const { useGetSettingsQuery } = settingApiSlice
