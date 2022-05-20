import orderProduceService from "../../services/orders/order-produce-service";
import { GetSocketMessage, PostSocketMessage } from "../../types/socket-message-types";
import { YugWebsocketAction } from "../../types/socket-types";


export const getSampleNames = ({ ws, service, msg }: YugWebsocketAction<PostSocketMessage>) => {
    try {
        
    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

interface ProduceEntity {
    productorKey?: string;
    productKey: string;
}

export const produceEntity = async ({ ws, service, msg }: YugWebsocketAction<PostSocketMessage<ProduceEntity>>) => {
    try {
        const { productKey, productorKey } = msg.data || {};
        const options = await orderProduceService.produce(productKey, productorKey)

        service.sender<PostSocketMessage>(ws, {
            method: 'post',
            action: '/produce-entity',
            headers: msg.headers,
            data: options
        });

    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

export const getProductEntity = ({ ws, service, msg }: YugWebsocketAction<GetSocketMessage>) => {
    try {

    } catch (e) {
        console.log(e);
        service.sendError(ws, e);
    }
}

