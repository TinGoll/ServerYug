import db from '../dataBase';
import { format } from 'date-format-parse';
import _ from 'lodash';
import User from '../entities/User';
import { Link } from '../types/linkTypes';


export const links: Link[] = [
    {link: '/bookkeeping',                          status: 0, permission: 'Links [Client] bookkeeping', description: 'Все страницы бухгалтерии'},
    {link: '/bookkeeping/period-calculation',       status: 0, permission: 'Links [Client] period-calculation', description: 'Бухгалтерия - расчет'},
    {link: '/bookkeeping/all-transaction',          status: 0, permission: 'Links [Client] all-transaction', description: 'Бухгалтерия - транзакции'},
    {link: '/orders',                               status: 0, permission: 'Links [Client] orders', description: 'Все заказы'},
    {link: '/order/create',                         status: 0, permission: 'Links [Client] order/create', description: 'Создание заказа'},
    {link: '/at-order',                             status: 0, permission: 'Links [Client] at-order', description: 'Прием-передача (с авторизацией)'},
    {link: '/nl-at-order',                          status: 0, permission: 'Links [Client] nl-at-order', description: 'Прием-передача (без авториазции)'},
    {link: '/',                                     status: 0, permission: 'Links [Client] main menu', description: 'Панель управления'}
];

export const getLinks = async (user: User): Promise<{link: string, status: boolean}[]> => {
    const tempLinks: {link: string, status: boolean}[] = [];
    for (const link of links) {
        let allowed: boolean = true;
        if (link.permission) allowed = await user.permissionCompare(link.permission);
        if (allowed) tempLinks.push({link: link.link, status: allowed});
    }
    return tempLinks;
}

export default {
    links,
    getLinks
}