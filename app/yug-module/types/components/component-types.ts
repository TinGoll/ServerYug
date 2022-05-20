
/******************************************************************* */
/** Имена комопнентов */
export type EntityComponentNames = typeof components[number]
/******************************************************************* */
/** Массив имен компонентов. */
const components = ['geometry'] as const
/******************************************************************* */

export interface DbComponent {
  ID: number;
  ID_ENTITY: number;
  COMPONENT_NAME: string;
  COMPONENT_DESCRIPTION: string;
  PROPERTY_NAME: string;
  PROPERTY_DESCRIPTION: string;
  PROPERTY_VALUE: string;
  PROPERTY_FORMULA: string;
  PROPERTY_TYPE: string;
  ATTRIBUTES: string;
  BINDING_TO_LIST: boolean;
  KEY: string;
  ENTITY_KEY: string;
  FORMULA_IMPORT: string;
}