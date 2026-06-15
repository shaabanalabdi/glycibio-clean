import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQuery } from "./baseQuery.js"

// ============================================================
// API RTK Query UNIQUE de l'application.
//
// AVANT : 11 createApi independants -> l'invalidation par tags ne fonctionnait
// QU'A L'INTERIEUR de chaque instance. Impossible, par ex., d'invalider le cache
// produit public depuis une mutation admin ; d'ou l'ancienne "god-slice" admin
// qui regroupait 9 ressources juste pour partager des tags.
//
// APRES : une seule API ; chaque domaine INJECTE ses endpoints ici via
// `baseApi.injectEndpoints(...)`. Resultat : un seul reducer + un seul
// middleware (store.js simplifie), et surtout des TAGS PARTAGES entre domaines
// -> coherence de cache inter-domaines (cf. useAuthenticated : invalidation
// ciblee panier/favoris/profil/commandes a la connexion).
//
// Les fichiers *ApiSlice.js conservent leurs exports de hooks identiques :
// AUCUN changement requis dans les composants.
// ============================================================
export const baseApi = createApi({
    reducerPath: "api",
    baseQuery,
    tagTypes: [
        // auth / utilisateur
        "authUser", "profile",
        // catalogue public
        "products", "product", "reviews", "categories", "methods",
        // espace connecte
        "cart", "orders", "wishlist",
        // back-office
        "adminDashboard", "adminProducts", "adminGallery", "adminCategories",
        "adminOrders", "adminContacts", "adminUsers", "adminShipping", "adminReviews"
    ],
    endpoints: () => ({})
})
