const db = require('../helper/db/bind_telegram')
const helper = require('../helper/utils/telegram')
const { data_valid_period } = require('../conf.d/telegram.json')

exports.bind = () => {
    return async (req, res) => {
        // req.user should be present.
        if (!req.user) return res.status(401).json({ ok: false, code: 401, description: 'Authorization required.' })
        // check whether already binded
        const bind_data = await db.getTelegramUIDByUser(req.user.id)
        if (bind_data) return res.status(403).json({ ok: false, code: 403, description: 'Already binded. Unbind first.' }) 
        // Extract parameters
        if (!req.body.payload) return res.status(400).json({ ok: false, code: 400, description: 'Missing parameters.' })
        const { payload } = req.body
        // validate the signature
        const validated = await helper.verifySignature(payload, data_valid_period)
        if (!validated) return res.status(400).json({ok: false, code: 400, description: 'Failed to validate the payload.'})
        // check whether already binded
        const last_data = await db.getUserByTelegramUID(payload.id)
        if (last_data) {
            await db.unbindTelegram(last_data.id)
        }

        await db.bindTelegram(req.user.id, payload.id)
        return res.json({ ok: true, data: { id: payload.id } })
    }
}

exports.unbind = () => {
    return async (req, res) => {
        // req.user should be present.
        if (!req.user) return res.status(401).json({ ok: false, code: 401, description: 'Authorization required.' })
        // check whether already binded
        const bind_data = await db.getTelegramUIDByUser(req.user.id)
        if (!bind_data) return res.status(403).json({ ok: false, code: 403, description: 'Not binded yet.' })
        await db.unbindTelegram(req.user.id)
        return res.json({ ok: true })
    }
}

exports.get = () => {
    return async (req, res) => {
        // req.user should be present.
        if (!req.user) return res.status(401).json({ ok: false, code: 401, description: 'Authorization required.' })
        const bind_data = await db.getTelegramUIDByUser(req.user.id)
        if (!bind_data) return res.status(404).json({ ok: false, code: 404, description: 'Not found.' })
        return res.json({ ok: true, data: { id: bind_data } })
    }
}
