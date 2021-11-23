import { NextFunction, Request, Response } from "express";
import ApiError from "../exceptions/ApiError";
import { getUserToToken } from "../systems/users";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) return next(ApiError.UnauthorizedError());
        //const [bearer, accessToken] = authorizationHeader.split(' ');
        const accessToken = authorizationHeader;
        if (!accessToken) return next (ApiError.UnauthorizedError());
        const user = await getUserToToken(accessToken);
        req.body.user = user;
        next();
    } catch (e) {return next(ApiError.UnauthorizedError())}
}