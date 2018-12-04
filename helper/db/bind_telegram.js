const db = require('.')

exports.getUserByTelegramUID = async (uid) => {
    const result = await db.query({
        text: 'SELECT A.* FROM "T_users" A INNER JOIN "T_binding_telegram" B ON A.id = B."user_id" WHERE B.id=$1',
        values: [parseInt(uid)]
    })
    if (result.rowCount === 0) return false
    else return result.rows[0]
}

exports.getTelegramUIDByUser = async (id) => {
    const result = await db.query({
        text: 'SELECT B.id FROM "T_users" A INNER JOIN "T_binding_telegram" B ON A.id = B."user_id" WHERE A.id=$1',
        values: [parseInt(id)]
    })
    if (result.rowCount === 0) return false
    else return result.rows[0].id
}

exports.bindTelegram = async (id, uid) => {
    const query = {
        text: 'INSERT INTO "T_binding_telegram" (id, "user_id") VALUES($1, $2) ON CONFLICT DO NOTHING;',
        values: [parseInt(uid), parseInt(id)]
    }
    return db.query(query)
}

exports.unbindTelegram = async (id) => {
    const query = {
        text: 'DELETE FROM "T_binding_telegram" WHERE "user_id"=$1',
        values: [parseInt(id)]
    }
    return db.query(query)
}
