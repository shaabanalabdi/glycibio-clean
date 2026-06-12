import { configureStore } from "@reduxjs/toolkit"
import { authApiSlice } from "./apiSlice/authApiSlice.js"
import { userApiSlice } from "./apiSlice/userApiSlice.js"
import { productApiSlice } from "./apiSlice/productApiSlice.js"
import { categoryApiSlice } from "./apiSlice/categoryApiSlice.js"
import { cartApiSlice } from "./apiSlice/cartApiSlice.js"
import { orderApiSlice } from "./apiSlice/orderApiSlice.js"
import { paymentApiSlice } from "./apiSlice/paymentApiSlice.js"
import { contactApiSlice } from "./apiSlice/contactApiSlice.js"
import { shippingApiSlice } from "./apiSlice/shippingApiSlice.js"
import { wishlistApiSlice } from "./apiSlice/wishlistApiSlice.js"
import { adminApiSlice } from "./apiSlice/adminApiSlice.js"

const store = configureStore({
    reducer: {
        [authApiSlice.reducerPath]: authApiSlice.reducer,
        [userApiSlice.reducerPath]: userApiSlice.reducer,
        [productApiSlice.reducerPath]: productApiSlice.reducer,
        [categoryApiSlice.reducerPath]: categoryApiSlice.reducer,
        [cartApiSlice.reducerPath]: cartApiSlice.reducer,
        [orderApiSlice.reducerPath]: orderApiSlice.reducer,
        [paymentApiSlice.reducerPath]: paymentApiSlice.reducer,
        [contactApiSlice.reducerPath]: contactApiSlice.reducer,
        [shippingApiSlice.reducerPath]: shippingApiSlice.reducer,
        [wishlistApiSlice.reducerPath]: wishlistApiSlice.reducer,
        [adminApiSlice.reducerPath]: adminApiSlice.reducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(
        authApiSlice.middleware,
        userApiSlice.middleware,
        productApiSlice.middleware,
        categoryApiSlice.middleware,
        cartApiSlice.middleware,
        orderApiSlice.middleware,
        paymentApiSlice.middleware,
        contactApiSlice.middleware,
        shippingApiSlice.middleware,
        wishlistApiSlice.middleware,
        adminApiSlice.middleware
    )
})

export default store
