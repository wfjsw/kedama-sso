const db = require('.')

const { checkBanned } = require('../utils/stats')

exports.getUserByMinecraftUUID = async (uuid) => {
    const result = await db.query({
        text: 'SELECT A.* FROM "T_users" A INNER JOIN "T_binding_minecraft" B ON A.id = B."user_id" WHERE B.uuid=$1',
        values: [uuid]
    })
    if (result.rowCount === 0) return false
    else {
        // Check ban status first. If banned, unbind.
        const is_banned = await checkBanned(uuid)
        if (is_banned) {
            // await exports.unbindMinecraft(result.rows[0].id)
            return false
        } else {
            return result.rows[0]
        }
    }
}

exports.getMinecraftUUIDByUser = async(id) => {
    const result = await db.query({
        text: 'SELECT B.uuid FROM "T_users" A INNER JOIN "T_binding_minecraft" B ON A.id = B."user_id" WHERE A.id=$1',
        values: [parseInt(id)]
    })
    if (result.rowCount === 0) return false
    else {
        // Check ban status first. If banned, unbind.
        const is_banned = await checkBanned(result.rows[0].uuid)
        if (is_banned) {
            // await exports.unbindMinecraft(result.rows[0].id)
            return false
        } else {
            return result.rows[0].uuid
        }
    } 
}

exports.bindMinecraft = async (id, uuid) => {
    const query = {
        text: 'INSERT INTO "T_binding_minecraft" (uuid, "user_id") VALUES($1, $2) ON CONFLICT DO NOTHING;',
        values: [uuid, parseInt(id)]
    }
    return db.query(query)
}

exports.unbindMinecraft = async (id) => {
    const query = {
        text: 'DELETE FROM "T_binding_minecraft" WHERE "user_id"=$1',
        values: [parseInt(id)]
    }
    return db.query(query)
}
