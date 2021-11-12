export default class ApiError extends Error {
    status: number;
    errors: any [];

    constructor (status: number, message: string, errors: any[] = []) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
    static UnauthorizedError () {
        return new ApiError(401, 'Пользователь не авторизован');
    }
    static BadRequest (message: string, errors: any[] = []) {
        return new ApiError(400, message, errors);
    }
    static Forbidden (errors: any[] = []) {
        return new ApiError(403, 'Нет прав доступа', errors);
    }
    static NotFound (errors: any [] = []) {
        return new ApiError(404, 'запрашиваемый ресурс не найден', errors);
    }
    
}