const express = require('express')

const qs = require('querystring')

const router = express.Router()

const db = require('../helper/db/oauth')
const dbu = require('../helper/db/user')

const bodyparser = require('body-parser')
const cors = require('cors')
const session_middleware = require('../middleware/session')
const oauth_middleware = require('../middleware/oauth')

const { getBBSDataByUser } = require('../helper/db/bind_bbs')
const { getMinecraftUUIDByUser } = require('../helper/db/bind_minecraft')
const { getTelegramUIDByUser } = require('../helper/db/bind_telegram')

router.get('/authorize', session_middleware.session(), session_middleware.check(false), async (req, res) => {
    if (req.session.oauth_authorize && !req.session.response_type) {
        if (Date.now() - req.session.oauth_authorize.createdTime > 15 * 60 * 1000) {
            // Expired request
            delete req.session.oauth_authorize
            return res.status(400).send('Request expired. Please re-issue an request.')
        }
    } else {
        const response_type = req.query.response_type
        if (['code', 'token'].indexOf(response_type) === -1) return req.sendStatus(400) // Serve as a flag
        const client_id = req.query.client_id
        if (!client_id) return req.sendStatus(400)
        const client = await db.getClient(client_id)
        if (!client) return req.sendStatus(404)
        const scope = req.query.scope || ''
        const arr_scope = scope.split(' ').filter(l => ['minecraft', 'bbs', 'telegram'].includes(l))
        const state = req.query.state

        req.session.oauth_authorize = {
            response_type,
            client_id,
            scope: arr_scope,
            state,
            createdTime: Date.now()
        }
    }
    if (!req.user) {
        return res.redirect('/login?' + qs.stringify({redirect: '/sso/authorize'}))
    }

    // check whether scope met
    let scope_valid = true
    const [bbs_bind, minecraft_bind, telegram_bind] = await Promise.all([getBBSDataByUser(req.user.id), getMinecraftUUIDByUser(req.user.id), getTelegramUIDByUser(req.user.id)])
    for (let sc of req.session.oauth_authorize.scope) {
        switch (sc) {
            case 'bbs':
                if (!bbs_bind) scope_valid = false
                break
            case 'minecraft':
                if (!minecraft_bind) scope_valid = false
                break
            case 'telegram':
                if (!telegram_bind) scope_valid = false
                break
        }
    }

    // Try to get a old token first
    const old_token_obj = await db.getAccessTokenByClientUser(req.session.oauth_authorize.client_id, req.user.id)
    if (old_token_obj && scope_valid) {
        // A fresh new token
        const { client_id, callback_url } = await db.getClient(req.session.oauth_authorize.client_id)
        const { state, response_type } = req.session.oauth_authorize
        delete req.session.oauth_authorize
        if (response_type === 'code') {
            // Authorization Code Flow

            const access_token_obj = await db.createAccessToken(client_id, req.user.id, 'code', 'authorization_code')
            return res.redirect(callback_url + '?' + qs.stringify({ state, code: access_token_obj.authorization_code }))
        } else if (response_type === 'token') {
            // Implicit Flow

            const access_token_obj = await db.createAccessToken(client_id, req.user.id, 'token', 'implicit')
            return res.redirect(callback_url + '?' + qs.stringify({
                state,
                access_token: access_token_obj.access_token,
                token_type: 'Bearer',
                user_id: access_token_obj.user_id
            }))
        }
    }
    const { app_name } = await db.getClient(req.session.oauth_authorize.client_id)
    // render authorization page
    return res.render('authorize', {
        app_name,
        require_scope: req.session.oauth_authorize.scope.length !== 0,
        scope_valid,
        scopes: req.session.oauth_authorize.scope
    })
})

router.post('/authorize', session_middleware.session(), session_middleware.check(true), async (req, res) => {
    if (!req.session.oauth_authorize) return res.status(400).json({ ok: false, code: 400, description: 'Authorize request not found. Please enable cookies if you disable it.' })
    
    if (Date.now() - req.session.oauth_authorize.createdTime > 15 * 60 * 1000) {
        // Expired request
        delete req.session.oauth_authorize
        return res.status(400).json({ ok: false, code: 400, description: 'Request expired. Please re-issue an request.' })
    }

    // check whether scopes met
    let scope_valid = true
    const [bbs_bind, minecraft_bind, telegram_bind] = await Promise.all([getBBSDataByUser(req.user.id), getMinecraftUUIDByUser(req.user.id), getTelegramUIDByUser(req.user.id)])
    for (let sc of req.session.oauth_authorize.scope) {
        switch (sc) {
            case 'bbs':
                if (!bbs_bind) scope_valid = false
                break
            case 'minecraft':
                if (!minecraft_bind) scope_valid = false
                break
            case 'telegram':
                if (!telegram_bind) scope_valid = false
                break
        }
    }
    if (!scope_valid) {
        delete req.session.oauth_authorize
        return res.status(403).json({ok: false, code: 403, description: `Scope request not met. Required scopes: ${req.session.oauth_authorize.scope.join(', ')}`})
    }
    const { client_id, callback_url } = await db.getClient(req.session.oauth_authorize.client_id)
    const { state, response_type } = req.session.oauth_authorize
    const access_token_obj = await db.createAccessToken(client_id, req.user.id, response_type, 'authorization_code')
    delete req.session.oauth_authorize
    if (response_type === 'code') {
        return res.json({ ok: true, redirect: callback_url + '?' + qs.stringify({ state, code: access_token_obj.authorization_code }) })
    } else if (response_type === 'token') {
        return res.json({
            ok: true,
            redirect: callback_url + '?' + qs.stringify({
                state,
                access_token: access_token_obj.access_token,
                token_type: 'Bearer',
                user_id: access_token_obj.user_id
            })
        })
    } else {
        return res.status(500).json({ ok: false, code: 403, description: `Invalid response_type.` })
    }
})

router.post('/token', cors(), bodyparser.urlencoded({extended: false}), bodyparser.json(), async (req, res) => {
    // check client_id and client_secret    
    const client_id = req.body.client_id
    const client_secret = req.body.client_secret
    const grant_type = req.body.grant_type

    if (!client_id || !client_secret) return res.status(401).json({ error: 'invalid_request', error_description: 'Client ID or Secret not found' })

    const client = await db.getClient(client_id)
    if (!client) return res.status(401).json({ error: 'invalid_client', error_description: 'Client not found' })
    if (client.client_secret !== client_secret) return res.status(401).json({ error: 'invalid_client', description: 'Client identification invalid' })


    if (grant_type === 'authorization_code') {
        const code = req.body.code
        if (!code) return res.status(400).json({ error: 'invalid_request', error_description: 'Authorization code not present' })
        const token_obj = await db.getAccessTokenByAuthorizationCode(client_id, code)
        if (!token_obj) return res.status(401).json({ error: 'invalid_grant', error_description: 'Authorization code not found' })
        if (token_obj.client_id !== client.client_id) return res.status(401).json({error: 'invalid_grant', error_description: 'Authorization code not found'})
        await db.dropAuthorizationCode(client_id, code)
        return res.json({
            access_token: token_obj.access_token,
            user_id: token_obj.user_id,
            token_type: 'Bearer'
        })
    } else if (grant_type === 'password') {
        const username = req.body.username
        const password = req.body.password
        if (!username || !password) return res.status(400).json({ error: 'invalid_grant', description: 'Username and Password not exist for Password Grant' })
        const user = await dbu.getUserByName(username)
        if (!user) return res.status(404).json({ error: 'invalid_grant', error_description: 'User not found.' })
        if (!user.app_password || user.app_password !== password) return res.status(401)
        const token_obj = await db.createAccessToken(client_id, user.id, 'token', 'password')
        return res.json({
            access_token: token_obj.access_token,
            user_id: token_obj.user_id,
            token_type: 'Bearer'
        })
    } else {
        return res.status(400).json({error: 'unsupported_grant_type', error_description: 'Not Implemented.'})
    }
})

router.get('/check', cors(), oauth_middleware.checkAccessToken(false), async (req, res) => {
    // Check Client Info First.
    const client_id = req.query.client_id
    const client_secret = req.query.client_secret
    if (!client_id || !client_secret) return res.status(400).json({ error: 'invalid_request', error_description: 'Cannot find client_id or client_secret' })
    const client = await db.getClient(client_id)
    if (!client) return res.status(401).json({error: 'invalid_client', error_description: 'Client not authenticated.'})
    if (!req.oauth) return res.json({
        active: false
    })
    if (req.oauth.client_id !== client_id) return res.json({
        active: false
    })
    // get scope 
    const scope = req.query.scope || ''
    if (scope) {
        const arr_scope = scope.split(' ')
        let scope_valid = true
        const [bbs_bind, minecraft_bind, telegram_bind] = await Promise.all([getBBSDataByUser(req.user.id), getMinecraftUUIDByUser(req.user.id), getTelegramUIDByUser(req.user.id)])
        for (let sc of arr_scope) {
            switch (sc) {
                case 'bbs': 
                    if (!bbs_bind) scope_valid = false
                    break
                case 'minecraft':
                    if (!minecraft_bind) scope_valid = false
                    break
                case 'telegram':
                    if (!telegram_bind) scope_valid = false
                    break
            }
        }
        if (!scope_valid) return res.json({
            active: false
        })
    }
    return res.json({
        active: true,
        client_id,
        user_id: req.oauth.user_id,
        username: req.oauth.username,
        issue_on: req.oauth.issue_on.valueOf()
    })
})

module.exports = router
