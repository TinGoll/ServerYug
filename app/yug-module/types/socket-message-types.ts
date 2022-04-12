

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
export interface DeleteSocketMessage<T extends any = { key: string }, H extends object = object> extends SocketMessage<H> {
    method: 'delete';
    action: DeleteActions;
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
type SocketMethods = typeof methods[number]
/****************************************************** */
/** Массив методов. */
const methods = ['connection', 'close', 'update', 'get', 'post', 'delete', 'error', 'info', 'success'] as const
/****************************************************** */


/** Массив POST actions */
type PostActions = typeof postActionTypes[number]
const postActionTypes = ['/add-engine-object', '/registration-object', '/construction-object'] as const
/****************************************************** */


/** Массив POST actions */
type GetActions = typeof getActionTypes[number]
const getActionTypes = ['/sample-components', '/sample-entities', '/formula-preparation-data'] as const
/****************************************************** */

/** Массив POST actions */
type DeleteActions = typeof deleteActionTypes[number]
const deleteActionTypes = ['/delete-object',] as const
/****************************************************** */