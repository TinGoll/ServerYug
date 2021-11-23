import User from "../entities/User";
import ApiError from "../exceptions/ApiError";
import users from "../systems/users";
import jwt from "jsonwebtoken"
import settings from "../settings";
import links from "../systems/links";
import jfunction from '../systems/virtualJournalsFun';
import { ILoginData } from "../types/auth-types";

class AuthService {
    /** Регистрация нового пользователя */
    async registration(options: any) {
        try {
            const {fio, gender, telephone, login: userName, pass: password, otherData} = options;
            let lastName: string = '', firstName: string = '', middleName: string = '';
             const [item1, item2, item3] = fio.split(' ');
            if (item1 && !item2) {firstName = item1;}
            else if (item1 && item2 && !item3) {
                firstName = item2;
                lastName = item1;
            }
            else {
                lastName = item1;
                firstName = item2;
                middleName = item3;
            }
            const candidate = await users.getUser(userName);
            if (candidate) throw ApiError.BadRequest('Такой пользователь уже существует.');
            const user = new User({
                userName, 
                password, 
                departament: 'Офис', 
                status: 1, 
                permissionGroupId: 1,
                firstName,
                lastName,
                middleName
            });
            const res = await user.save();    
            if(!res) ApiError.BadRequest('Ошибка сохранения пользователя.')   
            const loginData = await this.getLoginData(user);
            return loginData;

        } catch (e) {
            throw e;
        }
    }
    /** Вход в систему */
    async login(userName: string, password: string, barcode: string | undefined) {
        try {
            
        } catch (e) {
            throw e;
        }
    }
    /** Выход из системы */
    async logout() {
        try {
            
        } catch (e) {
            throw e;
        }
    }
    /** Обновление токена */
    async refresh() {
        try {
            
        } catch (e) {
            throw e;
        }
    }

    async getLoginData(user: User): Promise<ILoginData> {
        if (!user || !user.id) throw ApiError.UnauthorizedError();
        const token = jwt.sign(
                {userId: user.id},
                settings.secretKey,
                {expiresIn: '10h'}
        )
        await user.permissionLoad();
        const sectorName        = (await jfunction.getSectors()).find(s => s.id == user?.sectorId)?.name!
        const userLinks         = await links.getLinks(user);
        const permissionList    = await user.getPermission();

        const loginData: ILoginData = {
            token,
            userId: user?.id,
            user: {
                userName:       user.userName!, 
                firstName:      user.firstName, 
                lastName:       user.lastName, 
                middleName:     user.middleName, 
                isOwner:        user.isOwner,
                sectorId:       user.sectorId!,
                sectorName,
                permissionList,
                links:          userLinks
            }
        }
        return loginData;
    }

}

export default new AuthService();