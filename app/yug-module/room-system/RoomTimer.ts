interface ITimer<T extends string = string> {
    key: T;
    time: number;
    current: number;
    callback?: () => void;
    looping: boolean;
}

class RoomTimer<T extends string = string> extends Map<T, ITimer<T>> {
    /**
     * Конструктор
     * @param entries массив таймеров, опционально.
     */
    constructor(entries?: readonly (readonly [T, ITimer<T>])[] | null) {
        super(entries);
    }
   
    /**
     * Создать новый таймер
     * @param name имя таймера, если повториться, будет перезаписан
     * @param time количество секунд
     * @param callback функция, которая выполниться при достижении времени
     * @param looping будет ли повторяться таймер
     * @returns this
     */
    create(name: T, time: number = 0, callback: () => void, looping: boolean = true, ): RoomTimer {
        this.set(name, {
            key: name,
            current: 0,
            time,
            callback,
            looping
        })
        return this;
    }

    /**
     * Функция обновления таймеров.
     * @param dt время прошедшее между тактами в секундах.
     */
    update (dt: number) {
        this.forEach(val => {
            if (val.time > 0)  {
                val.current = val.current ? val.current += dt : dt;
                if (val.current >= val.time) {
                    val.current = 0;
                    if (val.callback && typeof val.callback === "function") {
                        val.callback();
                    }
                    if (!val.looping) this.delete(val.key);
                }
            }
        })
    }
}