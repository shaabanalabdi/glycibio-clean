import { fetchBaseQuery } from "@reduxjs/toolkit/query/react"

// Base commune a tous les apiSlices :
//   - credentials: "include" -> envoie le cookie HttpOnly d'authentification
//   - timeout 15s (meme garde-fou que l'ancien services/api.js)
export const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api"

export const baseQuery = fetchBaseQuery({
    baseUrl: API_URL,
    credentials: "include",
    timeout: 15000
})
