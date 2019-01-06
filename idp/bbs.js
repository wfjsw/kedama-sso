const db = require('../helper/db/bind_bbs')
const helper = require('../helper/utils/bbs')

exports.bind = () => {
    return async (req, res) => {
        // checkout username and password from request body
        // req.user should be present.
        if (!req.user) return res.status(401).json({ ok: false, code: 401, description: 'Authorization required.' })
        // check whether already binded
        const bind_data = await db.getBBSDataByUser(req.user.id)
        if (bind_data) return res.status(403).json({ok: false, code: 403, description: 'Already binded. Unbind first.'}) 
        const username = req.body.username || false
        const password = req.body.password || false
        if (!username || !password) return res.status(400).json({ ok: false, code: 400, description: 'Missing auth parameters.' })
        const { token, userId: uid } = await helper.loginToBBS(username, password)
        if (!uid) return res.status(401).json({ ok: false, code: 401, description: 'Login failed.' })
        const user_object = await helper.getUser(token, uid)
        if (!user_object) {
            res.status(401).json({ ok: false, code: 404, description: 'User not found.' })
        }
        const last_data = await db.getUserByBBSUID(uid)
        if (last_data) {
            await db.unbindBBS(last_data.id)
        }
        await db.bindBBS(req.user.id, uid)
        await db.setBBSName(req.user.id, user_object.attributes.username)
        return res.json({ ok: true, data: { id: uid, name: user_object.attributes.username}})
    }
}

exports.unbind = () => {
    return async (req, res) => {
        // req.user should be present.
        if (!req.user) return res.status(401).json({ ok: false, code: 401, description: 'Authorization required.' })
        // check whether already binded
        const bind_data = await db.getBBSDataByUser(req.user.id)
        if (!bind_data) return res.status(403).json({ ok: false, code: 403, description: 'Not binded yet.' }) 
        await db.unbindBBS(req.user.id)
        return res.json({ ok: true })
    }
}

exports.get = () => {
    return async (req, res) => {
        // req.user should be present.
        if (!req.user) return res.status(401).json({ ok: false, code: 401, description: 'Authorization required.' })
        const bind_data = await db.getBBSDataByUser(req.user.id)
        if (!bind_data) return res.status(404).json({ ok: false, code: 404, description: 'Not found.' })
        return res.json({ ok: true, data: bind_data })
    }
}
