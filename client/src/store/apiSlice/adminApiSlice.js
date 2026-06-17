import { baseApi } from "./baseApi.js"

// Endpoints du back-office injectes dans l'API UNIQUE (baseApi). Les tagTypes
// admin sont declares dans baseApi : l'invalidation peut desormais traverser
// les domaines (ex. produit modifie en admin -> liste publique rafraichie).
export const adminApiSlice = baseApi.injectEndpoints({
    endpoints: (build) => ({
        // --- Dashboard ---
        getDashboard: build.query({
            query: () => ({ url: "/admin/dashboard", method: "GET" }),
            transformResponse: (response) => response.dashboard,
            providesTags: ["adminDashboard"]
        }),

        // --- Produits ---
        getAdminProducts: build.query({
            query: (params = {}) => ({ url: "/admin/products", method: "GET", params }),
            transformResponse: (response) => response.products,
            providesTags: ["adminProducts"]
        }),
        getAdminProduct: build.query({
            query: (id) => ({ url: `/admin/products/${id}`, method: "GET" }),
            transformResponse: (response) => response.product,
            providesTags: (result, error, id) => [{ type: "adminProducts", id }]
        }),
        createProduct: build.mutation({
            // formData : multipart (image + champs)
            query: (formData) => ({
                url: "/admin/products",
                method: "POST",
                body: formData
            }),
            invalidatesTags: ["adminProducts", "adminDashboard"]
        }),
        updateProduct: build.mutation({
            query: ({ id, formData }) => ({
                url: `/admin/products/${id}`,
                method: "PUT",
                body: formData
            }),
            invalidatesTags: ["adminProducts", "adminDashboard"]
        }),
        deleteProduct: build.mutation({
            query: (id) => ({ url: `/admin/products/${id}`, method: "DELETE" }),
            invalidatesTags: ["adminProducts", "adminDashboard"]
        }),
        permanentDeleteProduct: build.mutation({
            query: (id) => ({ url: `/admin/products/${id}/permanent`, method: "DELETE" }),
            invalidatesTags: ["adminProducts", "adminDashboard"]
        }),

        // --- Galerie produit ---
        getGallery: build.query({
            query: (productId) => ({ url: `/admin/products/${productId}/images`, method: "GET" }),
            transformResponse: (response) => response.images,
            providesTags: (result, error, productId) => [{ type: "adminGallery", id: productId }]
        }),
        addGalleryImage: build.mutation({
            query: ({ productId, formData }) => ({
                url: `/admin/products/${productId}/images`,
                method: "POST",
                body: formData
            }),
            invalidatesTags: (result, error, { productId }) => [{ type: "adminGallery", id: productId }]
        }),
        deleteGalleryImage: build.mutation({
            query: ({ productId, imageId }) => ({
                url: `/admin/products/${productId}/images/${imageId}`,
                method: "DELETE"
            }),
            invalidatesTags: (result, error, { productId }) => [{ type: "adminGallery", id: productId }]
        }),

        // --- Categories ---
        getAdminCategories: build.query({
            query: () => ({ url: "/admin/categories", method: "GET" }),
            transformResponse: (response) => response.categories,
            providesTags: ["adminCategories"]
        }),
        createCategory: build.mutation({
            query: (data) => ({ url: "/admin/categories", method: "POST", body: data }),
            invalidatesTags: ["adminCategories"]
        }),
        updateCategory: build.mutation({
            query: ({ id, ...data }) => ({ url: `/admin/categories/${id}`, method: "PUT", body: data }),
            invalidatesTags: ["adminCategories"]
        }),
        deleteCategory: build.mutation({
            query: (id) => ({ url: `/admin/categories/${id}`, method: "DELETE" }),
            invalidatesTags: ["adminCategories"]
        }),

        // --- Commandes ---
        getAdminOrders: build.query({
            query: () => ({ url: "/admin/orders", method: "GET" }),
            transformResponse: (response) => response.orders,
            providesTags: ["adminOrders"]
        }),
        updateOrderStatus: build.mutation({
            query: ({ id, status }) => ({
                url: `/admin/orders/${id}/status`,
                method: "PUT",
                body: { status }
            }),
            invalidatesTags: ["adminOrders", "adminDashboard"]
        }),

        // --- Messages de contact ---
        getAdminContacts: build.query({
            query: () => ({ url: "/admin/contacts", method: "GET" }),
            transformResponse: (response) => response.messages,
            providesTags: ["adminContacts"]
        }),
        markContactRead: build.mutation({
            query: (id) => ({ url: `/admin/contacts/${id}/read`, method: "PUT" }),
            invalidatesTags: ["adminContacts"]
        }),

        // --- Utilisateurs ---
        getAdminUsers: build.query({
            query: () => ({ url: "/admin/users", method: "GET" }),
            transformResponse: (response) => response.users,
            providesTags: ["adminUsers"]
        }),
        updateUserRole: build.mutation({
            query: ({ id, role }) => ({
                url: `/admin/users/${id}/role`,
                method: "PUT",
                body: { role }
            }),
            invalidatesTags: ["adminUsers"]
        }),
        deleteUser: build.mutation({
            query: (id) => ({ url: `/admin/users/${id}`, method: "DELETE" }),
            invalidatesTags: ["adminUsers"]
        }),

        // --- Modes de livraison ---
        getAdminShipping: build.query({
            query: () => ({ url: "/admin/shipping", method: "GET" }),
            transformResponse: (response) => response.methods,
            providesTags: ["adminShipping"]
        }),
        createShippingMethod: build.mutation({
            query: (data) => ({ url: "/admin/shipping", method: "POST", body: data }),
            invalidatesTags: ["adminShipping"]
        }),
        updateShippingMethod: build.mutation({
            query: ({ id, ...data }) => ({ url: `/admin/shipping/${id}`, method: "PUT", body: data }),
            invalidatesTags: ["adminShipping"]
        }),
        deleteShippingMethod: build.mutation({
            query: (id) => ({ url: `/admin/shipping/${id}`, method: "DELETE" }),
            invalidatesTags: ["adminShipping"]
        }),

        // --- Avis (moderation) ---
        getAdminReviews: build.query({
            query: (status = "pending") => ({ url: "/admin/reviews", method: "GET", params: { status } }),
            transformResponse: (response) => response.reviews,
            providesTags: ["adminReviews"]
        }),
        updateReviewStatus: build.mutation({
            query: ({ id, status }) => ({
                url: `/admin/reviews/${id}`,
                method: "PUT",
                body: { status }
            }),
            invalidatesTags: ["adminReviews"]
        }),

        // --- Apparence / personnalisation (image de fond du hero) ---
        updateHeroBackground: build.mutation({
            // formData : multipart (champ "image")
            query: (formData) => ({
                url: "/admin/settings/hero-background",
                method: "PUT",
                body: formData
            }),
            invalidatesTags: ["settings"]
        }),
        resetHeroBackground: build.mutation({
            query: () => ({
                url: "/admin/settings/hero-background",
                method: "DELETE"
            }),
            invalidatesTags: ["settings"]
        }),
        updateHeroContent: build.mutation({
            // body : { hero_title, hero_text, ... } (champs texte du hero)
            query: (body) => ({
                url: "/admin/settings/hero-content",
                method: "PUT",
                body
            }),
            invalidatesTags: ["settings"]
        })
    })
})

export const {
    useGetDashboardQuery,
    useGetAdminProductsQuery,
    useGetAdminProductQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
    usePermanentDeleteProductMutation,
    useGetGalleryQuery,
    useAddGalleryImageMutation,
    useDeleteGalleryImageMutation,
    useGetAdminCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
    useGetAdminOrdersQuery,
    useUpdateOrderStatusMutation,
    useGetAdminContactsQuery,
    useMarkContactReadMutation,
    useGetAdminUsersQuery,
    useUpdateUserRoleMutation,
    useDeleteUserMutation,
    useGetAdminShippingQuery,
    useCreateShippingMethodMutation,
    useUpdateShippingMethodMutation,
    useDeleteShippingMethodMutation,
    useGetAdminReviewsQuery,
    useUpdateReviewStatusMutation,
    useUpdateHeroBackgroundMutation,
    useResetHeroBackgroundMutation,
    useUpdateHeroContentMutation
} = adminApiSlice
