const dbu = require('../helper/db/user')
const db = require('../helper/db/bind_minecraft')
const helper = require('../helper/utils/mojang')
const { auth_token } = require('../conf.d/irc_remote.json')
const { checkBanned } = require('../helper/utils/stats')

exports.bind = () => {
    return async (req, res) => {
        // This should be called by agent hooked in IRC Forwarder
        // Check whether source is correct
        const utoken = req.get('X-Token')
        if (utoken !== auth_token) return res.status(401).json({ok: false, code: 401, description: 'Unauthorized.'})
        // Extract parameters
        if (!req.body.name || !req.body.token) return res.status(400).json({ok: false, code: 400, description: 'Missing parameters.'})
        const { name, token } = req.body
        const user_obj = await dbu.getUserByToken(token)
        if (!user_obj) return res.status(404).json({ ok: false, code: 404, description: 'User Not Found.' })
        // check whether already binded
        const bind_data = await db.getMinecraftUUIDByUser(user_obj.id)
        if (bind_data) {
            // Check banned here. If have a banned binding history, refuse further rebinds.
            const is_banned = await checkBanned(bind_data)
            if (is_banned) return res.json({ ok: false, code: 403, description: 'User have banned history. ' })
            await db.unbindMinecraft(user_obj.id)
        }
        const uuid = await helper.nameToUUID(name)
        if (!uuid) return res.status(404).json({ ok: false, code: 404, description: 'Unable to resolve player name.' })
        const last_data = await db.getUserByMinecraftUUID(uuid)
        if (last_data) {
            await db.unbindBBS(last_data.id)
        }

        await db.bindMinecraft(user_obj.id, uuid)
        await dbu.resetToken(user_obj.id)
        return res.json({ ok: true, data: { user: user_obj, uuid } })
    }
}

exports.unbind = () => {
    return async (req, res) => {
        // req.user should be present.
        if (!req.user) return res.status(401).json({ ok: false, code: 401, description: 'Authorization required.' })
        // check whether already binded
        const bind_data = await db.getMinecraftUUIDByUser(req.user.id)
        if (!bind_data) return res.status(403).json({ ok: false, code: 403, description: 'Not binded yet.' })
        const is_banned = await checkBanned(bind_data)
        if (is_banned) return res.json({ ok: false, code: 403, description: 'User have banned uid history. ' })
        await db.unbindMinecraft(req.user.id)
        return res.json({ ok: true })
    }
}

exports.get = () => {
    return async (req, res) => {
        // req.user should be present.
        if (!req.user) return res.status(401).json({ ok: false, code: 401, description: 'Authorization required.' })
        const bind_data = await db.getMinecraftUUIDByUser(req.user.id)
        if (!bind_data) return res.status(404).json({ ok: false, code: 404, description: 'Not found.' })
        return res.json({ ok: true, data: { uuid: bind_data } })
    }
}
