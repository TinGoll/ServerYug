import db from '../dataBase';
import User from '../entities/User';
import { UserOptionsDb } from '../types/userTypes';
import jwt from 'jsonwebtoken';
import ApiError from '../exceptions/ApiError';
import { decodedDto } from '../types/user';
import settings from '../settings';

let userList: User []   = [];

export const getUserToToken = async (token: string | undefined): Promise<User> => {
    try {
        if (!token) throw new Error();
        const decoded: string | jwt.JwtPayload = jwt.verify(token, settings.secretKey);
        const user = await getUserToID((decoded as decodedDto).userId);
        if (!user) throw new Error();
        return user;
    } catch (e) {
        throw ApiError.UnauthorizedError();
    }
}

export const getAllUsers = async (): Promise<User[]> => {
    try {
        const res = await db.executeRequest(`
            SELECT DISTINCT
                E.ID, E.MGMT_PASS, E.NAME, E.FIRSTNAME, E.LASTNAME, E.MIDDLENAME,
                E.BANK_CARD, E.PHONE, E.CARD_HOLDER,
                E.DEPARTMENT, E.ID_SECTOR, E.STATUS, E.LOCATION,
                PERMISSION_GROUP_ID, G.NAME AS PERMISSION_GROUP
            FROM EMPLOYERS E
            LEFT JOIN PERMISSIONS_GROUP G ON (E.PERMISSION_GROUP_ID = G.ID)
        `);
        if (res.length) {
            const tempUserList = res.map(item => {
                return createUser(item);
            });
            userList = [...tempUserList];
        }
        return userList;
    } catch (error) {
        console.log(error);
        return [];
    }
}

export const getUser = async (userName: string): Promise<User | null> => {
    try {
        const condidate = userList.find(item => item?.userName?.toUpperCase() == userName.toUpperCase());
        if (condidate) return condidate;
        const res = await db.executeRequest(`
            SELECT
            E.ID, E.MGMT_PASS, E.NAME, E.FIRSTNAME, E.LASTNAME, E.MIDDLENAME,
            E.BANK_CARD, E.PHONE, E.CARD_HOLDER,
            E.DEPARTMENT, E.ID_SECTOR, E.STATUS, E.LOCATION,
            PERMISSION_GROUP_ID, G.NAME AS PERMISSION_GROUP
                FROM EMPLOYERS E
                LEFT JOIN PERMISSIONS_GROUP G ON (E.PERMISSION_GROUP_ID = G.ID)
                WHERE UPPER(E.NAME) = UPPER('${userName}')`);

        if (!res || res.length == 0) return null;                                                
        const [item] = res;                               
        const user = createUser(item);
        userList.push(user);
        return user;
    } catch (error) {
        console.log('Ошибка getUser', error);
        return null;
    }  
}

export const getUserToID = async (id: number): Promise<User | null> => {
    try {
        const condidate = userList.find(item => item.id === id);
        if (condidate) return condidate;
        const [item] = await db.executeRequest(`
            SELECT
            E.ID, E.MGMT_PASS, E.NAME, E.FIRSTNAME, E.LASTNAME, E.MIDDLENAME,
            E.BANK_CARD, E.PHONE, E.CARD_HOLDER,
            E.DEPARTMENT, E.ID_SECTOR, E.STATUS, E.LOCATION,
            PERMISSION_GROUP_ID, G.NAME AS PERMISSION_GROUP
                FROM EMPLOYERS E
                LEFT JOIN PERMISSIONS_GROUP G ON (E.PERMISSION_GROUP_ID = G.ID)
                WHERE E.id = ${id}`);
        if (!item)  return null; 
        const user = createUser(item);
        userList.push(user);
        return user;
    } catch (error) {
        const e = error as Error;
        throw new Error('Get User To ID: ' + e.message);
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
    getAllUsers,
    userList
}