import { PropertyValue, ApiComponent } from "yug-entity-system-async";
import {
  EntityDto,
  ComponentDto,
} from "yug-entity-system-async/dist/@engine-types";

// Интерфейсы для order метода

export interface CreateOrderData {
  entityKey: string;
}

export interface OpenOrderData {
  entityKey: string;
  newOrder?: boolean;
}

export interface CloseOrderData {
  roomKey: string;
}

export interface AddOrderElementData {
  roomKey: string;
  entityKey: string;
  addedKey: string;
}

export interface DeleteOrderElementData {
  roomKey: string;
  deletedKeys: string[];
}

export interface EditOrderElementData {
  roomKey: string;
  editedKey: string;
  propertyKey: string;
  //value: PropertyValue;
  dto: ComponentDto;
}

export interface GetAllOrderData {
  filter?: {
    categories?: string[];
    names?: string[];
    notes?: string[];
    componentNames?: string[];
  };
}

export interface GetSampleNames {
  filter?: { key: string; name: string; note?: string; category?: string };
}

export interface GetApiEntityToKey {
  key: string;
}

export interface ChangeEntityComponentToKey {
  entityKey: string;
  apiComponent: ApiComponent;
}

export interface RemovePropertyFromElement {
  roomKey: string;
  entityKey: string;
  propertyKeys: string[]
}

export interface AddPropertyToElement {
  roomKey: string;
  entityKey: string;
  propertyKeys: string[];
}

export interface CreateSampleEntityOrderData {
  entityDto: EntityDto;
  components?: ApiComponent[];
  cloneKey?: string;
}

export interface CreateSampleComponentOrderData {
  componentDto: ComponentDto;
  components?: ApiComponent[];
}

export interface DeleteSampleComponentOrderData {
  componentKeys: string[];
}


export interface EditSampleComponent {
  componentKey: string;
  componentDto: ComponentDto;
}

export interface EntityPreparationData {
  roomKey: string;
  entityKey: string;
  componentKey: string;
}
