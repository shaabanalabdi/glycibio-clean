import * as dotenv from "dotenv";
import {Logger} from "../services/Logger.js";
import {SentryService} from "../services/Sentry.js";

dotenv.config()

const getErrorMessage = (error) => {
    if (process.env.NODE_ENV === "production" && (error.status || 500) === 500) {
        return "Internal Server Error"
    }
    return error.message || "An error occurred"
}

export const errorHandler = (error, req, res, next) => {
    const httpError = error
    const status = httpError.status || httpError.statusCode || 500

    Logger.error(`[ERROR] ${req.method} ${req.originalUrl}`, { status, error: httpError.message })

    if (status === 500) {
        SentryService.captureException(httpError, { path: req.path })
    }

    const errorResponse = {
        status,
        message: getErrorMessage(httpError),
        path: req.path,
        timestamp: new Date().toISOString()
    }

    if (httpError.errors) {
        errorResponse.errors = httpError.errors
    }

    const requestId = req.headers["x-request-id"]
    if (requestId) {
        errorResponse.requestId = requestId
    }

    res.status(status).json(errorResponse)
}
