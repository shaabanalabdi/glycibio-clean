import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export const Toaster = () => {
    const toasterConfig = {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        newestOnTop: true
    }

    return <ToastContainer {...toasterConfig} />
}
