import { fetchBaseQuery } from "@reduxjs/toolkit/query/react"

// Base commune a tous les apiSlices :
//   - credentials: "include" -> envoie le cookie HttpOnly d'authentification
//   - timeout 15s (meme garde-fou que l'ancien services/api.js)
export const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api"

// Lit un cookie non-httpOnly cote client (ici : le jeton CSRF depose par l'API).
const readCookie = (name) => {
    if (typeof document === "undefined") return null
    const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"))
    return match ? decodeURIComponent(match[1]) : null
}

export const baseQuery = fetchBaseQuery({
    baseUrl: API_URL,
    credentials: "include",
    timeout: 15000,
    // Renvoie le jeton CSRF dans l'en-tete attendu par le serveur (double-submit).
    // Inoffensif sur les requetes GET ; requis sur POST/PUT/PATCH/DELETE.
    prepareHeaders: (headers) => {
        const csrf = readCookie("csrf_token")
        if (csrf) headers.set("X-CSRF-Token", csrf)
        return headers
    }
})
