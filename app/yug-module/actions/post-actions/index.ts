import ApiError from "../../../exceptions/ApiError";
import componentModel from "../../db-models/component-model";
import { SocketService } from "../../services/socket-service";
import { PostSocketMessage } from "../../types/socket-message-types";
import { YugWebsocket } from "../../types/socket-types";
import { addEngineObject, constructionObject, registrationObject } from "./engine-object";
import { produceEntity } from "./order-actions";


const postActions = async (ws: YugWebsocket, service: SocketService, msg: PostSocketMessage) => {
    try {
        switch (msg.action) {
            case '/add-engine-object':
                addEngineObject({ws, service, msg}); // Добавление нового комопнента или номенклатуры.
                break;
            case '/registration-object':
                registrationObject({ ws, service, msg }); // Добавление нового комопнента или номенклатуры.
                break;
            case '/construction-object':
                constructionObject({ ws, service, msg }); // Добавление нового комопнента или номенклатуры.
                break;
            case '/produce-entity':
                produceEntity({ ws, service, msg }); // Продуцирование сущностей
                break;
            default:
                break;
        }
    } catch (e) {
       service.sendError(ws, e, msg.headers)
    }
}

export default postActions;