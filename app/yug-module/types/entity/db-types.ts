
export interface ENTITIES {
  ID: number | null;
  ID_PARENT: number | null;
  ID_SAMPLE: number | null;
  CATEGORY: string | null;
  NAME: string | null;
  NOTE: string | null;
  DATE_CREATION: Date | null;
  DATE_UPDATE: Date | null;
}

export interface COMPONENT {
  ID: number | null;
  ID_ENTITY: number | null;
  COMPONENT_NAME: string | null;
  COMPONENT_DESCRIPTION: string | null;
  PROPERTY_NAME: string | null;
  PROPERTY_DESCRIPTION: string | null;
  PROPERTY_VALUE: string | null;
  PROPERTY_FORMULA: string | null;
  PROPERTY_TYPE: string | null;
  ATTRIBUTES: string | null;
  BINDING_TO_LIST: boolean | null;
}

export interface LISTS {
  ID: number | null;
  LIST_DESCRIPTION: string | null;
  LIST_NAME: string | null;
  LIST_DATA: string | null;
}