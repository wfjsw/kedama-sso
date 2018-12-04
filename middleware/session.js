const db = require('../helper/db')
const userdb = require('../helper/db/user')
const { scrypt } = require('../helper/utils/password')
const { timingSafeEqual } = require('crypto')
const { cookie_secret } = require('../config.json')
const session = require('express-session')
const pg_session_store = require('connect-pg-simple')(session)

exports.session = () => {
    return session({
        store: new pg_session_store({
            pool: db,
            tableName: 'T_session'
        }),
        secret: cookie_secret,
        resave: false,
        name: 'SESSIONID',
        unset: 'destroy',
        saveUninitialized: false,
        cookie: {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'lax'
        }
    })
}

exports.login = (usernameField = 'username', passwordField = 'password', enforced = true, failureRedirect, session = true) => {
    if (!usernameField) usernameField = 'username'
    if (!passwordField) passwordField = 'password'
    return async (req, res, next) => {
        if (req.user) return next() // Already logged in. Bypass.
        if (!req.body[usernameField]) return res.status(400).json({ ok: false, code: 400, description: 'Empty username'})
        const user_obj = await userdb.getUserByName(req.body[usernameField])
        if (!user_obj) {
            if (enforced && !failureRedirect) {
                return res.status(401).json({ok: false, code: 401, description: 'User not exist'})
            } else if (failureRedirect) {
                return res.redirect(failureRedirect)
            }
            req.user = new Error('USER_NOT_EXIST')
            return next()
        }
        if (!req.body[passwordField]) return res.status(400).json({ ok: false, code: 400, description: 'Empty password' })
        const encpwd = await scrypt(req.body[passwordField], user_obj.salt)
        if (timingSafeEqual(user_obj.password, encpwd)) {
            // authentication success
            req.user = user_obj // mount user object
            if (session) {
                req.session.user = {
                    id: user_obj.id,
                    auth_time: Date.now()
                }
            }
            return next()
        } else {
            if (enforced && !failureRedirect) {
                return res.status(401).json({ok: false, code: 401, description: 'Password not match'})
            } else if (failureRedirect) {
                return res.redirect(failureRedirect)
            }
            req.user = new Error('PASSWORD_NOT_MATCH')
            return next()
        }
    }
}

exports.logout = () => {
    return async (req, res, next) => {
        delete req.session.user
        delete req.user
        return next()
    }
}

exports.signup = (usernameField = 'username', passwordField = 'password', enforced = true, failureRedirect, session = true) => {
    if (!usernameField) usernameField = 'username'
    if (!passwordField) passwordField = 'password'
    return async (req, res, next) => {
        if (req.user) return next() // Already logged in. Bypass.
        const old_user_obj = await userdb.getUserByName(req.body[usernameField])
        if (old_user_obj) {
            if (enforced && !failureRedirect) {
                return res.status(401).json({ ok: false, code: 401, description: 'User already exist' })
            } else if (failureRedirect) {
                return res.redirect(failureRedirect)
            }
            req.user = new Error('USER_ALREADY_EXIST')
            return next()
        }
        
        const user_obj = await userdb.createUser(req.body[usernameField], req.body[passwordField])

        req.user = user_obj // mount user object
        if (session) {
            req.session.user = {
                id: user_obj.id,
                auth_time: Date.now()
            }
        }
        return next()
    }
}

exports.check = (enforced = true, failureRedirect) => {
    return async (req, res, next) => {
        if (!req.session.user) {
            if (enforced && !failureRedirect) {
                return res.sendStatus(403)
            } else if (failureRedirect) {
                req.session.lastRedir = req.location
                return res.redirect(failureRedirect)
            }
            req.user = false
            return next()
        }
        const user_obj = await userdb.getUser(req.session.user.id)
        if (req.session.user.auth_time < user_obj.password_changed) {
            // Password has changed after login session established
            delete req.session.user
            delete req.user
            if (enforced && !failureRedirect) {
                return res.sendStatus(403)
            } else if (failureRedirect) {
                req.session.lastRedir = req.location
                return res.redirect(failureRedirect)
            }
            req.user = false
            return next()
        }
        req.user = user_obj
        return next()
    }
}
