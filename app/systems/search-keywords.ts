import { IKeyword } from "../types/system-types";

export const orderKeywords: IKeyword [] = [
                {key: 'Упакованные',        value: 'Упакован'},
                {key: 'Упакован',           value: 'Упакован'},
                {key: 'Запакован',          value: 'Упакован'},
                {key: 'Запакован',          value: 'Упакован'},

                {key: 'Готов',              value: 'Отгружен'},
                {key: 'Отправлен',          value: 'Отгружен'},
                {key: 'Отгружен',           value: 'Отгружен'},
                {key: 'Отгруженные',        value: 'Отгружен'},

                {key: 'На сборке',          value: 'На сборке'},
                {key: 'На шлифовке',        value: 'На шлифовке'},
                {key: 'Покраска',           value: 'Покраска этап №1'},
                {key: 'Патина',             value: 'Патина этап №2'},
                {key: 'Лак',                value: 'Лак этап №3'},
                {key: 'В упаковке',         value: 'В упаковке'},

            ];