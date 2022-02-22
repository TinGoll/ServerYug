import User from "../../../entities/User";
import { getUserToToken } from "../../../systems/users";
import { SocketServive } from "../../services/socket-service";
import { ConnectionSocketMessageToBot, ConnectionSocketMessage } from "../../types/socket-message-types";
import { YugWebsocket } from "../../types/socket-types";
import { errorMessage } from "../../utils/error-messages";


const connectionAction = async (ws: YugWebsocket, service: SocketServive, msg: ConnectionSocketMessageToBot) => {
    try {
        if (msg.isBot) {
            const bot = new User({
                id:0,
                userName: "Бот Вася",
                firstName: "Василий",
                lastName: "Бот"
            })
            ws.data = {
                ...ws.data!,
                isAuth: true,
                token:'бот',
                user: bot
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
                token: msg.token
            }
        }
        service.sender<ConnectionSocketMessage>(ws, {
            method: "connection",
            message: `${ws.data.user?.getUserName()}, добро пожаловать!`
        });
        service.broadcastsystem.broadcast(ws, {
            method: "connection",
            message: `${ws.data.user?.getUserName()} вошёл в чат.`
        })
    } catch (e) {
        service.sendError(ws, e);
    }
}

export default connectionAction;