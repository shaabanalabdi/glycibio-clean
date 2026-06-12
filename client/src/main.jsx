import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Provider } from "react-redux"
import store from "./store/store.js"
import App from "./App.jsx"
import { initSentry } from "./Utils/sentry"
import "./assets/style/main.scss"

// Init Sentry uniquement cote client
if (typeof window !== "undefined") {
    void initSentry()
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </Provider>
    </StrictMode>
)
