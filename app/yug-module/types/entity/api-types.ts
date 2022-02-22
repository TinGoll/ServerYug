
/** Модель Компонент отделка */
export interface APIFinishingComponent {
  id?: number;
  colorId?: number;
  patinaId?: number;
  varnishId?: number;
  componentDescription: string
}
/** Модель компонент геометрия */
export interface APIGeometryComponent {
  id?: number;
  height?: number;
  width?: number;
  depth?: number;
  amount?: number;
  square?: number;
  cubature?: number;
  linearMeter?: number;
  componentDescription: string
}

/** Модель компонент цена */
export interface APIPriceComponent {
  id?: number;
  price?: number;
  componentDescription: string
}

/** Тут определить компоненты, для которых нужен автокомплит и стандартизация */
export interface GeometryComponent { geometry: Omit<APIGeometryComponent, 'id'> }
export interface FinishingComponent { finishing: Omit<APIPriceComponent, "id"> }
export interface PriceComponent { price: Omit<APIPriceComponent, "id"> }