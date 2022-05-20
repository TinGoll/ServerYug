import { ApiComponent, ApiEntity } from "yug-entity-system";


export interface EngineObjectData {
    type?: 'entity' | 'component';
    object: ApiComponent[] | ApiEntity[];
}



export interface EngineBuildtData {
    key?: string;                               // Ключ объекта (сущность или комопонент)
    object?: ApiComponent[] | ApiEntity[];      // новый объект (сущность или комопонент)
    attachmentKeys?: string[];                  // массив ключей, которые надо вложить (экперементально)
    attachment?: ApiComponent[] | ApiEntity[];  // вложение, в объект
    cloneKey?: string;                          // При клонирования добавить поле с ключом клона
}