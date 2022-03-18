import ApiError from "../../../exceptions/ApiError";
import componentModel from "../../db-models/component-model";
import { SocketServive } from "../../services/socket-service";
import { PostSocketMessage } from "../../types/socket-message-types";
import { YugWebsocket } from "../../types/socket-types";
import { addEngineObject, registrationObject } from "./engine-object";


const postActions = async (ws: YugWebsocket, service: SocketServive, msg: PostSocketMessage) => {
    try {
        switch (msg.action) {
            case '/add-engine-object':
                addEngineObject({ws, service, msg}); // Добавление нового комопнента или номенклатуры.
                break;
            case '/registration-object':
                registrationObject({ ws, service, msg }); // Добавление нового комопнента или номенклатуры.
                break;
            default:
                break;
        }
    } catch (e) {
       service.sendError(ws, e, msg.headers)
    }
}

export default postActions;