const db = require('../dataBase');


const fun = async (db) => {
    const plans = await db.executeRequest(`
    select s.id, s.order_id
    from journal_shlif s
    where s.shlif_name = 'Шлиф.филенок'
    `);

    console.log(plans);

    for (const p of plans) {

        const query = `
        select first 1 DATE_SECTOR
        from ORDERS_DATE_PLAN OD
        where upper(OD.DATE_DESCRIPTION) = 'ШЛИФОВКА' and
        OD.ORDER_ID = ${p.ORDER_ID}`;

        const [dataPlan] = await db.executeRequest(query);
        const name = dataPlan.DATE_SECTOR.replace(new RegExp(' Шлифовка', 'g'), '').trim();
        console.log(name);
        /*
        await db.executeRequest(`
            update journal_shlif s
            set s.shlif_name = '${name}'
            where s.id = ${p.ID}
        `)
        */
    }

}

fun(db);