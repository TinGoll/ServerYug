import User from '../entities/User';
import { UserOptionsDb } from '../types/userTypes';
import jwt from 'jsonwebtoken';
import ApiError from '../exceptions/ApiError';
import { decodedDto } from '../types/user';
import settings from '../settings';

import UserSystem from './user-system';

export const getUserToToken = async (token: string | undefined): Promise<User> => {
    try {
        if (!token) throw new Error();
        const decoded: string | jwt.JwtPayload = jwt.verify(token, settings.secretKey);
        const user = await getUserToID((decoded as decodedDto).userId);
        if (!user) throw new Error();
        if (!user.isOwner && user.permissionList.length == 0) await user.refrash();
        return user;
    } catch (e) {
        throw ApiError.UnauthorizedError();
    }
}

export const getAllUsers = async (): Promise<User[]> => {
    try {
        const system = new UserSystem();
        const users = await system.getAll();
        return users
    } catch (e) {
        throw e;
    }
}

export const getUser = async (userName: string): Promise<User | null> => {
    try {
        const system = new UserSystem();
        const user = await system.getToUserName(userName);
        return user;
    } catch (e) {
        throw e;
    }
}

export const getUserToID = async (id: number): Promise<User | null> => {
    try {
        const system = new UserSystem();
        const user = await system.get(id);
        return user;
    } catch (e) {
        throw e;
    }
}

export const createUser = (options: UserOptionsDb): User => {
    const user = new User({
        id:                     options.ID,
        password:               options.MGMT_PASS,
        userName:               options.NAME,
        firstName:              options.FIRSTNAME,
        lastName:               options.LASTNAME,
        middleName:             options.MIDDLENAME,
        departament:            options.DEPARTMENT,
        sectorId:               options.ID_SECTOR,
        status:                 options.STATUS,
        location:               options.LOCATION,
        permissionGroupId:      options.PERMISSION_GROUP_ID,
        permissionGroupName:    options.PERMISSION_GROUP,
        card:                   options.BANK_CARD,
        cardHolder:             options.CARD_HOLDER,
        phone:                  options.PHONE
    });
    return user;
}

export default {
    getUser,
    getUserToID,
    getAllUsers
}