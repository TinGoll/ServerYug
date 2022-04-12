"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ApiError extends Error {
    constructor(status, message, errors = []) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
    static UnauthorizedError() {
        return new ApiError(401, 'Пользователь не авторизован');
    }
    static BadRequest(message, errors = []) {
        return new ApiError(400, message, errors);
    }
    static Forbidden(errors = []) {
        return new ApiError(403, 'Нет прав доступа', errors);
    }
    static NotFound(errors = []) {
        return new ApiError(404, 'Запрашиваемый ресурс не найден', errors);
    }
}
exports.default = ApiError;
