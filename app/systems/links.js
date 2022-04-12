"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLinks = exports.links = void 0;
exports.links = [
    { link: '/bookkeeping', status: 0, permission: 'Links [Client] bookkeeping', description: 'Все страницы бухгалтерии' },
    { link: '/bookkeeping/period-calculation', status: 0, permission: 'Links [Client] period-calculation', description: 'Бухгалтерия - расчет' },
    { link: '/bookkeeping/all-transaction', status: 0, permission: 'Links [Client] all-transaction', description: 'Бухгалтерия - транзакции' },
    { link: '/orders', status: 0, permission: 'Links [Client] orders', description: 'Все заказы' },
    { link: '/order/create', status: 0, permission: 'Links [Client] order/create', description: 'Создание заказа' },
    { link: '/at-order', status: 0, permission: 'Links [Client] at-order', description: 'Прием-передача (с авторизацией)' },
    { link: '/nl-at-order', status: 0, permission: 'Links [Client] nl-at-order', description: 'Прием-передача (без авториазции)' },
    { link: '/', status: 0, permission: 'Links [Client] main menu', description: 'Панель управления' }
];
const getLinks = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const tempLinks = [];
    for (const link of exports.links) {
        let allowed = true;
        if (link.permission)
            allowed = yield user.permissionCompare(link.permission);
        if (allowed)
            tempLinks.push({ link: link.link, status: allowed });
    }
    return tempLinks;
});
exports.getLinks = getLinks;
exports.default = {
    links: exports.links,
    getLinks: exports.getLinks
};
