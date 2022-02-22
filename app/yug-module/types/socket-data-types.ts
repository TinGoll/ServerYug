import { ApiComponent, ApiEntityOptions } from "yug-entity-system";

export interface EngineObjectData {
    type?: 'entity' | 'component'
    object: ApiComponent[] | ApiEntityOptions;
}