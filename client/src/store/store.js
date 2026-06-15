import { configureStore } from "@reduxjs/toolkit"
import { setupListeners } from "@reduxjs/toolkit/query"
import { baseApi } from "./apiSlice/baseApi.js"

// Chaque domaine injecte ses endpoints dans baseApi (injectEndpoints). On
// importe les fichiers pour garantir l'enregistrement des endpoints (et donc
// des hooks) des la creation du store, y compris pour des routes chargees
// paresseusement.
import "./apiSlice/authApiSlice.js"
import "./apiSlice/userApiSlice.js"
import "./apiSlice/productApiSlice.js"
import "./apiSlice/categoryApiSlice.js"
import "./apiSlice/cartApiSlice.js"
import "./apiSlice/orderApiSlice.js"
import "./apiSlice/paymentApiSlice.js"
import "./apiSlice/contactApiSlice.js"
import "./apiSlice/shippingApiSlice.js"
import "./apiSlice/wishlistApiSlice.js"
import "./apiSlice/settingApiSlice.js"
import "./apiSlice/adminApiSlice.js"

// Cache RTK Query UNIQUE : un seul reducer + un seul middleware (au lieu de 11).
const store = configureStore({
    reducer: {
        [baseApi.reducerPath]: baseApi.reducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware)
})

// Active refetchOnFocus / refetchOnReconnect (pour les endpoints qui l'activent)
// et permet le keepUnusedDataFor cote endpoints.
setupListeners(store.dispatch)

export default store
