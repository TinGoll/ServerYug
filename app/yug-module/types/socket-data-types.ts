import { ApiComponent } from "yug-entity-system";
import { ApiEntity, ApiOptionsEntity } from "yug-entity-system/dist/types/entity-types";

export interface EngineObjectData {
    type?: 'entity' | 'component'
    object: ApiComponent[] | ApiEntity[];
}