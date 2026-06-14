import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import { ProtectedRoute } from "@components/ProtectedRoute/index.jsx"

// Page d'accueil chargee eagerly (entree principale)
import { Home } from "@pages/Home/index.jsx"

// Pages chargees a la demande (-40-60% du bundle initial)
const lazyPage = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })))

const Catalog = lazyPage(() => import("@pages/Catalog/index.jsx"), "Catalog")
const Product = lazyPage(() => import("@pages/Product/index.jsx"), "Product")
const Login = lazyPage(() => import("@pages/Login/index.jsx"), "Login")
const Register = lazyPage(() => import("@pages/Register/index.jsx"), "Register")
const ForgotPassword = lazyPage(() => import("@pages/ForgotPassword/index.jsx"), "ForgotPassword")
const ResetPassword = lazyPage(() => import("@pages/ResetPassword/index.jsx"), "ResetPassword")
const VerifyEmail = lazyPage(() => import("@pages/VerifyEmail/index.jsx"), "VerifyEmail")
const Profile = lazyPage(() => import("@pages/Profile/index.jsx"), "Profile")
const Cart = lazyPage(() => import("@pages/Cart/index.jsx"), "Cart")
const Checkout = lazyPage(() => import("@pages/Checkout/index.jsx"), "Checkout")
const OrderSuccess = lazyPage(() => import("@pages/OrderSuccess/index.jsx"), "OrderSuccess")
const Contact = lazyPage(() => import("@pages/Contact/index.jsx"), "Contact")
const About = lazyPage(() => import("@pages/About/index.jsx"), "About")
const Wishlist = lazyPage(() => import("@pages/Wishlist/index.jsx"), "Wishlist")
const Admin = lazyPage(() => import("@pages/Admin/index.jsx"), "Admin")
const LegalNotice = lazyPage(() => import("@pages/LegalNotice/index.jsx"), "LegalNotice")
const Terms = lazyPage(() => import("@pages/Terms/index.jsx"), "Terms")
const PrivacyPolicy = lazyPage(() => import("@pages/PrivacyPolicy/index.jsx"), "PrivacyPolicy")
const Cookies = lazyPage(() => import("@pages/Cookies/index.jsx"), "Cookies")
const WithdrawalForm = lazyPage(() => import("@pages/WithdrawalForm/index.jsx"), "WithdrawalForm")
const NotFound = lazyPage(() => import("@pages/NotFound/index.jsx"), "NotFound")

const PageFallback = () => (
    <p className="page-loading">Chargement...</p>
)

export const AppRouter = () => {
    return (
        <Suspense fallback={<PageFallback />}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalogue" element={<Catalog />} />
                <Route path="/produit/:id" element={<Product />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
                <Route path="/reinitialiser-mdp" element={<ResetPassword />} />
                <Route path="/verifier-email" element={<VerifyEmail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/a-propos" element={<About />} />
                <Route path="/mentions-legales" element={<LegalNotice />} />
                <Route path="/cgv" element={<Terms />} />
                <Route path="/politique-confidentialite" element={<PrivacyPolicy />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/formulaire-retractation" element={<WithdrawalForm />} />
                <Route path="/panier" element={<Cart />} />
                <Route path="/profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/favoris" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                <Route path="/commande" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/commande/succes" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    )
}
