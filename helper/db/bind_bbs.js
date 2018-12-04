const db = require('.')

exports.getUserByBBSUID = async (uid) => {
    const result = await db.query({
        text: 'SELECT A.* FROM "T_users" A INNER JOIN "T_binding_bbs" B ON A.id = B."user_id" WHERE B.id=$1',
        values: [parseInt(uid)]
    })
    if (result.rowCount === 0) return false
    else return result.rows[0]
}

exports.getBBSDataByUser = async (id) => {
    const result = await db.query({
        text: 'SELECT B.id, B.name FROM "T_users" A INNER JOIN "T_binding_bbs" B ON A.id = B."user_id" WHERE A.id=$1',
        values: [parseInt(id)]
    })
    if (result.rowCount === 0) return false
    else return result.rows[0]
}

exports.bindBBS = async (id, uid) => {
    const query = {
        text: 'INSERT INTO "T_binding_bbs" (id, "user_id") VALUES($1, $2) ON CONFLICT DO NOTHING;',
        values: [parseInt(uid), parseInt(id)]
    }
    return db.query(query)
}

exports.unbindBBS = async (id) => {
    const query = {
        text: 'DELETE FROM "T_binding_bbs" WHERE "user_id"=$1',
        values: [parseInt(id)]
    }
    return db.query(query)
}

exports.setBBSName = async (id, name) => {
    const query = {
        text: 'UPDATE "T_binding_bbs" SET name=$1 WHERE "user_id"=$2;',
        values: [name, parseInt(id)]
    }
    return db.query(query)
}
