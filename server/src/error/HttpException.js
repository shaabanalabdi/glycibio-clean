import {HTTP_STATUS} from "./HttpStatus.js"

export class HttpException extends Error {
    status
    message
    errors

    constructor(message, status, errors) {
        super(message)
        this.status = status
        this.message = message
        this.errors = errors
    }
}

export class ValidationException extends HttpException {
    constructor(message = "Validation Error", errors) {
        super(message, HTTP_STATUS.BAD_REQUEST, errors)
    }
}

export class UnauthorizedException extends HttpException {
    constructor(message = "Unauthorized", errors) {
        super(message, HTTP_STATUS.UNAUTHORIZED, errors)
    }
}

export class ForbiddenException extends HttpException {
    constructor(message = "Forbidden", errors) {
        super(message, HTTP_STATUS.FORBIDDEN, errors)
    }
}

export class NotFoundException extends HttpException {
    constructor(resource) {
        super(resource ? `${resource} not found` : `Resource not found`, HTTP_STATUS.NOT_FOUND)
    }
}

export class ConflictException extends HttpException {
    constructor(message = "Conflict", errors) {
        super(message, HTTP_STATUS.CONFLICT, errors)
    }
}

export class TooManyRequestsException extends HttpException {
    constructor(message = "Too Many Requests", errors) {
        super(message, HTTP_STATUS.TOO_MANY_REQUESTS, errors)
    }
}

export class ServiceUnavailableException extends HttpException {
    constructor(message = "Service Unavailable", errors) {
        super(message, HTTP_STATUS.SERVICE_UNAVAILABLE, errors)
    }
}

export class InternalServerErrorException extends HttpException {
    constructor(message = "Internal Server Error", errors) {
        super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, errors)
    }
}
