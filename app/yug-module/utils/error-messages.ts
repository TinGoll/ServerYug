import { ErrorSocketMessage } from "../types/socket-message-types"

const defaultErrorMessage: ErrorSocketMessage = {
    method: "error",
    message: "Неизвестная ошибка.",
    errors: []
}

const errors = ['incorrect message', 'not registered', 'unauthorized'] as const

type ErrorMessageType = typeof errors[number]

export const errorMessage = {
    get(variant: ErrorMessageType, data: string[] = []): ErrorSocketMessage {
        switch (variant) {
            case "incorrect message":
                return {
                    method: "error",
                    message: "Hекорректный формат пакета.",
                    errors: [...data]
                }
            case "not registered":
                return {
                    method: "error",
                    message: `Пользователь не зарегистрирован. Для регистрации необходимо отправить пакет "connection", с токеном доступа.`,
                    errors: [...data]
                }
            case "unauthorized":
                return {
                    method: "error",
                    message: `Клиент не авторизован, некорректный или просроченный токен.`,
                    errors: [...data]
                }
            default:
                return defaultErrorMessage;
        }
    }
}