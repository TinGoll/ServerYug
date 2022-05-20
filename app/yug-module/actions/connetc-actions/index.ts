import User from "../../../entities/User";
import { getUserToToken } from "../../../systems/users";
import { SocketService } from "../../services/socket-service";
import { ConnectionSocketMessageToBot, ConnectionSocketMessage } from "../../types/socket-message-types";
import { YugWebsocket } from "../../types/socket-types";
import { errorMessage } from "../../utils/error-messages";

const nickBot = [
    'Майор ФСБ Тристан Обрамович Гладков',
    'Полковник ФСБ Глеб Иванович Свинолуп',
    'Сержант ФСБ Игорь Сандалович Козин',
    'Иван Сусанин',
    'Мирзаахмат Санакулович Норбеков',
]

const connectionAction = async (ws: YugWebsocket, service: SocketService, msg: ConnectionSocketMessageToBot) => {
    try {
        if (msg.isBot) {

            const bot = new User({
                id:0,
                userName: nickBot[Math.floor(Math.random() * nickBot.length)],
                firstName: "Василий",
                lastName: "Бот"
            });

            ws.data = {
                ...ws.data!,
                isAuth: true,
                token:'бот',
                user: bot,
                roomData: {
                    roomKey: null
                }
            }
        } else {
            let user: User;
            try {user = await getUserToToken(msg.token);} catch (e) {
                service.sender(ws, errorMessage.get("unauthorized"));
                return;
            } 
            ws.data = {
                ...ws.data!,
                isAuth: true,
                user: user,
                token: msg.token,
                roomData: {
                    roomKey: null
                }
            }
        }

        service.sender<ConnectionSocketMessage>(ws, {
            method: "connection",
            message: `${ws.data!.user?.getUserName()}, добро пожаловать!`
        });

        service.broadcastsystem.broadcast( {
            method: "connection",
            message: `${ws.data!.user?.getUserName()} вошёл в чат.`
        })
    } catch (e) {
        service.sendError(ws, e);
    }
}

export default connectionAction;