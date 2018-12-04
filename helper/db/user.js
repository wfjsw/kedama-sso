const db = require('.')
const crypto = require('crypto')

const upwd = require('../utils/password')

exports.getUser = async (id) => {
    const result = await db.query({
        text: 'SELECT * FROM "T_users" WHERE id=$1',
        values: [parseInt(id)]
    })
    if (result.rowCount === 0) return false 
    else return result.rows[0]
}

exports.getUserByName = async (name) => {
    const result = await db.query({
        text: 'SELECT * FROM "T_users" WHERE LOWER(username)=$1',
        values: [name.toLowerCase()]
    })
    if (result.rowCount === 0) return false
    else return result.rows[0]
}

exports.getUserByToken = async (token) => {
    const result = await db.query({
        text: 'SELECT * FROM "T_users" WHERE token=$1',
        values: [token]
    })
    if (result.rowCount === 0) return false
    else return result.rows[0]
}

exports.createUser = async (username, password) => {
    const token = crypto.randomBytes(16).toString('hex')
    const salt = upwd.genSalt()
    const encpwd = await upwd.scrypt(password, salt)
    const query = {
        text: 'INSERT INTO "T_users" (username, password, salt, token) VALUES($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING *;',
        values: [username, encpwd, salt, token]
    }
    const result = await db.query(query)
    if (result.rowCount === 0) return false
    else return result.rows[0]
}

exports.changePassword = async (id, password) => {
    const salt = upwd.genSalt()
    const encpwd = await upwd.scrypt(password, salt)
    const query = {
        text: 'UPDATE "T_users" SET password=$1, salt=$2, password_changed=$3 WHERE id=$4;',
        values: [encpwd, salt, new Date(), parseInt(id)]
    }
    return db.query(query)
}

exports.setUserApplicationPassword = async (id, password) => {
    const query = {
        text: 'UPDATE "T_users" SET app_password = $1, app_password_changed=$2 WHERE id=$3;',
        values: [password, new Date(), parseInt(id)]
    }
    return db.query(query)
}

exports.deleteUserApplicationPassword = async (id) => {
    const query = {
        text: 'UPDATE "T_users" SET app_password = NULL, app_password_changed=$1 WHERE id=$2;',
        values: [new Date(), parseInt(id)]
    }
    return db.query(query)
}

exports.resetToken = async (id) => {
    const token = crypto.randomBytes(16).toString('hex')
    const query = {
        text: 'UPDATE "T_users" SET token=$1 WHERE id=$2;',
        values: [token, parseInt(id)]
    }
    await db.query(query)
    return token
}

exports.deleteUser = async (id) => {
    return db.query({
        text: 'DELETE FROM "T_users" WHERE id=$1',
        values: [id]
    })
}
