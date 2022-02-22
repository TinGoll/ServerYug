

export interface DbEntity {
  ID: number;
  ID_PARENT: number;
  ID_SAMPLE: number;
  CATEGORY: string;
  NAME: string;
  NOTE: string;
  DATE_CREATION: Date;
  DATE_UPDATE: Date;
}
