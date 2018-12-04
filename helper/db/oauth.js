const db = require('.')
const dbu = require('./user')
const crypto = require('crypto')

/**
 * Get client.
 */

exports.getClient = async (id) => {
    const result = await db.query({
        text: 'SELECT * FROM "T_oauth_clients" WHERE "client_id" = $1',
        values: [id]
    })
    if (result.rowCount === 0) return false
    const client = result.rows[0]
    return client
}

exports.getClientsByUser = async (user_id) => {
    const result = await db.query({
        text: 'SELECT * FROM "T_oauth_clients" WHERE owner = $1',
        values: [user_id]
    })
    if (result.rowCount === 0) return false
    const client = result.rows
    return client
}

exports.createClient = async (user_id, app_name, homepage_url = '', callback_url = '') => {
    if (!app_name) throw new Error('app_name not present')
    const user = await dbu.getUser(parseInt(user_id))
    if (!user) throw new Error('User not found')

    const client_id = crypto.randomBytes(8).toString('hex')
    const client_secret = crypto.randomBytes(16).toString('hex')

    const result = await db.query({
        text: 'INSERT INTO "T_oauth_clients" ("client_id", "client_secret", "app_name", "homepage_url", "callback_url", "owner", "time") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        values: [client_id, client_secret, app_name, homepage_url, callback_url, user.id, new Date()]
    })

    return result.rows[0]
}

exports.updateClient = async (client_id, app_name = null, homepage_url = null, callback_url = null) => {
    if (!client_id) throw new Error('client_id not present')
    const client = await exports.getClient(client_id)
    if (!client) throw new Error('Client not found')

    let text = [], values = []

    if (!app_name && !homepage_url && !callback_url) throw new Error('Specify at least one parameter.')

    if (app_name) {
        values.push(app_name)
        text.push(`"app_name" = $${values.length}`)
    } 
    if (homepage_url) {
        values.push(homepage_url)
        text.push(`"homepage_url" = $${values.length}`)
    }
    if (callback_url) {
        values.push(callback_url)
        text.push(`"callback_url" = $${values.length}`)
    }

    const result = await db.query({
        text: `UPDATE "T_oauth_clients" SET ${text.join(', ')} WHERE "client_id" = ${client.client_id}`,
        values
    })

    return result.rows[0]
}

exports.resetClientSecret = async (id) => {
    const client = await exports.getClient(id)
    if (!client) throw new Error('Client not found')
    const new_secret = crypto.randomBytes(16).toString('hex')
    await db.query({
        text: 'UPDATE "T_oauth_clients" SET client_secret = $1 WHERE "client_id" = $2',
        values: [new_secret, client.client_id]
    })
    return new_secret
}

exports.deleteClient = async (id) => {
    await db.query({
        text: 'DELETE FROM "T_oauth_clients" WHERE "client_id" = $1',
        values: [parseInt(id)]
    })
    return true
}

exports.getAccessToken = async (access_token) => {
    const result = await db.query({
        text: 'SELECT * FROM "T_oauth_tokens" WHERE "access_token" = $1',
        values: [access_token]
    })
    if (result.rowCount === 0) return false
    const token = result.rows[0]
    const user_obj = await dbu.getUser(token.user_id)
    if (user_obj.password_changed > token.issue_on) {
        // Access token should expire
        await exports.revokeAccessToken(token.id)
        return false
    }
    if (token.grant_type === 'password') {
        if (user_obj.app_password_changed) {
            if (user_obj.app_password_changed > token.issue_on) {
                // Access token should expire
                await exports.revokeAccessToken(token.id)
                return false
            }
        } else if (user_obj.app_password === null) {
            // Access token should expire
            await exports.revokeAccessToken(token.id)
            return false
        }
    }
    await db.query({
        text: 'UPDATE "T_oauth_tokens" SET "last_accessed" = $1 WHERE "access_token" = $2',
        values: [new Date(), access_token]
    })
    token.user = user_obj
    return token
}

exports.getAccessTokenByAuthorizationCode = async (client_id, authorization_code) => {
    const result = await db.query({
        text: 'SELECT * FROM "T_oauth_tokens" WHERE "client_id" = $1 AND "authorization_code" = $2',
        values: [client_id, authorization_code]
    })
    if (result.rowCount === 0) return false
    const token = result.rows[0]
    return token
}

exports.getAccessTokenByClientUser = async (client_id, user_id) => {
    const result = await db.query({
        text: 'SELECT * FROM "T_oauth_tokens" WHERE "client_id" = $1 AND "user_id" = $2',
        values: [client_id, user_id]
    })
    if (result.rowCount === 0) return false
    const token = result.rows[0]
    const user_obj = await dbu.getUser(token.user_id)
    if (user_obj.password_changed > token.issue_on) {
        // Access token should expire
        await exports.revokeAccessToken(token.id)
        return false
    }
    await db.query({
        text: 'UPDATE "T_oauth_tokens" SET last_accessed = $1 WHERE "access_token" = $2',
        values: [new Date(), token.access_token]
    })
    token.user = user_obj
    return token
}

exports.createAccessToken = async (client_id, user_id, flow_type, grant_type) => {
    if (!client_id || !user_id) throw new Error('client_id or user_id not present')

    const client = await exports.getClient(client_id)
    if (!client) throw new Error('Client not found')
    const user = await dbu.getUser(parseInt(user_id))
    if (!user) throw new Error('User not found')

    // check whether already have an access token
    const last_token = await exports.getAccessTokenByClientUser(client_id, user_id)
    if (last_token) {
        // Revoke old token before we issue a new one
        await exports.revokeAccessToken(last_token.id)
    }

    const access_token = crypto.randomBytes(32).toString('hex')
    if (flow_type === 'code') {
        // authorization_code flow

        const authorization_code = crypto.randomBytes(16).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

        const result = await db.query({
            text: 'INSERT INTO "T_oauth_tokens" ("access_token", "issue_on", "user_id", "client_id", "authorization_code", "last_accessed", "grant_type") VALUES ($1, $2, $3, $4, $5, $2, $6) RETURNING *',
            values: [access_token, new Date(), user.id, client_id, authorization_code, grant_type]
        })

        return result.rows[0]
    } else if (flow_type === 'token') {
        // implicit flow
        const result = await db.query({
            text: 'INSERT INTO "T_oauth_tokens" ("access_token", "issue_on", "user_id", "client_id", "last_accessed", "grant_type") VALUES ($1, $2, $3, $4, $2, $5) RETURNING *',
            values: [access_token, new Date(), user.id, client_id, grant_type]
        })

        return result.rows[0]
    } else throw new Error('Unknown Flow Type.')

}

exports.dropAuthorizationCode = async (client_id, authorization_code) => {
    if (!authorization_code) return false
    await db.query({
        text: 'UPDATE "T_oauth_tokens" SET "authorization_code" = NULL, "issue_on" = $1 WHERE "client_id" = $2 AND "authorization_code" = $3',
        values: [new Date(), client_id, authorization_code]
    })
    return true
}

exports.purgeAccessTokenByClient = async (id) => {
    await db.query({
        text: 'DELETE FROM "T_oauth_tokens" WHERE "client_id" = $1',
        values: [id]
    })
    return true
}

exports.purgeAccessTokenByUser = async (id) => {
    await db.query({
        text: 'DELETE FROM "T_oauth_tokens" WHERE "user_id" = $1',
        values: [parseInt(id)]
    })
    return true
} 

exports.revokeAccessToken = async (access_token) => {
    await db.query({
        text: 'DELETE FROM "T_oauth_tokens" WHERE "access_token" = $1',
        values: [access_token]
    })
    return true
}

exports.revokeAccessTokenByClientUser = async (client_id, user_id) => {
    await db.query({
        text: 'DELETE FROM "T_oauth_tokens" WHERE "client_id" = $1 AND "user_id" = $2',
        values: [client_id, parseInt(user_id)]
    })
    return true
}
