

/****************************************************** */
//               SOCKET MESSAGE INTERFACES



/****************************************************** */
export interface ConnectionSocketMessage extends SocketMessage {
    method: 'connection';
    token?: string;
    message?: string;
}
/****************************************************** */
/** H - тип объекта headers  */
export interface InfoSocketMessage<H extends object = object> extends SocketMessage<H> {
    method: 'info';
    message: string;
    details?: string [];
    testTimer?: number;
}
export interface CloseSocketMessage extends SocketMessage {
    method: 'close';
    message: string;
    reason?: string;
}
export interface ErrorSocketMessage extends SocketMessage {
    method: 'error';
    message: string;
    errors: string[];
}
export interface SuccessSocketMessage<T extends any = any, H extends object = object> extends SocketMessage {
    method: 'success';
    message: string;
    headers?: H;
    data: T;
}
/** * T - тип объекта data, H - тип объекта headers */
export interface PostSocketMessage<T extends any = any, H extends object = object> extends SocketMessage<H> {
    method: 'post';
    action: PostActions;
    data: T;
}

/** * T - тип объекта data, H - тип объекта headers */
export interface PutSocketMessage<T extends any = any, H extends object = object> extends SocketMessage<H> {
    method: 'put';
    action: PutActions;
    data: T;
}

export interface DeleteSocketMessage<T extends any = { key: string }, H extends object = object> extends SocketMessage<H> {
    method: 'delete';
    action: DeleteActions;
    data: T;
}

/** * T - тип объекта data, H - тип объекта headers */
export interface OrderSocketMessage<T extends any = any, H extends object = object> extends SocketMessage<H> {
    method: 'order';
    action: OrderActions;
    data: T;
}

/**
 * * Возвращает результат get зпроса в объекте response. Для типизации объекта, используйте Generic <T>
 * * H - тип объекта headers 
 */
export interface GetSocketMessage<T extends any = any, H extends object = object> extends SocketMessage<H> {
    method: 'get';
    action: GetActions;
    data?: T
}

export interface SocketMessage<H extends object = object> {
    method: SocketMethods,
    headers?: H;
}

/**************************************** Ниже сервисные типы ******************************************************* */

/****************************************************** */
export interface ConnectionSocketMessageToBot extends ConnectionSocketMessage {
    isBot?: boolean
}
/****************************************************** */
export type SocketMethods = typeof methods[number]
/****************************************************** */
/** Массив методов. */
const methods = ['connection', 'close', 'update', 'get', 'post', 'delete', 'error', 'info', 'success', 'put', 'order'] as const
/****************************************************** */


/** Массив POST actions */
type PostActions = typeof postActionTypes[number]
const postActionTypes = [
    '/add-engine-object', 
    '/registration-object', 
    '/construction-object',
    '/produce-entity'
] as const
/****************************************************** */

/** Массив ORDER actions */
export type OrderActions = typeof orderActionTypes[number]
const orderActionTypes = [
    '/create-room',
    '/open-room',
    '/close-room',
    '/add-room-element',
    '/delete-room-element',
    '/edit-room-element',
    '/get-room-data',
    '/get-current-user',
    '/get-room-history',
    '/get-all-orders',
    '/get-api-directory',
    '/get-changed-order-data',
    '/get-sample-names',
    '/get-api-entity-to-key',
    '/change-entity-component',
    '/add-property-to-element',
    '/remove-property-from-element',
    '/create-sample-entity',
    '/create-sample-component',
    '/sample-components',
    '/edit-sample-components',
    '/formula-preparation-data'
] as const
/****************************************************** */

/** Массив PUT actions */
type PutActions = typeof putActionTypes[number]
const putActionTypes = [
    '/change-entity-component',
] as const
/****************************************************** */

/** Массив GET actions */
type GetActions = typeof getActionTypes[number]
const getActionTypes = [
    '/sample-components', 
    '/sample-entities', 
    '/formula-preparation-data', 
    '/get-sample-names', 
    '/get-api-entity-to-key', 
    '/get-entity-categories'] as const
/****************************************************** */

/** Массив POST actions */
type DeleteActions = typeof deleteActionTypes[number]
const deleteActionTypes = ['/delete-object',] as const
/****************************************************** */