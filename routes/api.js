const express = require('express')

const router = express.Router()

const cors = require('cors')
const oauth_middleware = require('../middleware/oauth')
const dbu = require('../helper/db/user')
const { getBBSDataByUser, getUserByBBSUID } = require('../helper/db/bind_bbs')
const { getMinecraftUUIDByUser, getUserByMinecraftUUID } = require('../helper/db/bind_minecraft')
const { getTelegramUIDByUser, getUserByTelegramUID }= require('../helper/db/bind_telegram')

router.get('/user/:uid/getProfile', cors(), async (req, res) => {
    if (!req.params.uid) return res.status(400).json({ ok: false, code: 400, description: 'Missing uid.' })
    if (isNaN(req.params.uid)) return res.status(400).json({ ok: false, code: 400, description: 'Invalid uid.' })
    const uid = parseInt(req.params.uid)
    if (!uid) return res.status(404).json({ ok: false, code: 404, description: 'User not found.' })
    const user = await dbu.getUser(uid)
    if (!user) return res.status(404).json({ ok: false, code: 404, description: 'User not found.' })
    let output = {}
    output.id = user.id
    output.username = user.username
    return res.json({ok: true, data: output})
})

router.get('/user/:uid/getBindings', cors(), oauth_middleware.checkAccessToken(false), async (req, res) => {
    if (!req.params.uid) return res.status(400).json({ ok: false, code: 400, description: 'Missing uid.' })
    if (isNaN(req.params.uid)) return res.status(400).json({ ok: false, code: 400, description: 'Invalid uid.' })
    const uid = parseInt(req.params.uid)
    if (!uid) return res.status(404).json({ ok: false, code: 404, description: 'User not found.' })
    const user = await dbu.getUser(uid)
    if (!user) return res.status(404).json({ ok: false, code: 404, description: 'User not found.' })
    const [bbs_bind, minecraft_bind, telegram_bind] = await Promise.all([getBBSDataByUser(user.id), getMinecraftUUIDByUser(user.id), getTelegramUIDByUser(user.id)])
    if (req.user && req.user.id === user.id) {
        return res.json({
            ok: true,
            data: {
                bbs: bbs_bind || false,
                minecraft: minecraft_bind || false,
                telegram: telegram_bind || false
            }
        })
    } else {
        return res.json({
            ok: true,
            data: {
                bbs: !!bbs_bind,
                minecraft: !!minecraft_bind,
                telegram: !!telegram_bind
            }
        })
    }
})

router.get('/bindings/bbs/:uid', cors(), async (req, res) => {
    if (!req.params.uid) return res.status(400).json({ ok: false, code: 400, description: 'Missing uid.' })
    if (isNaN(req.params.uid)) return res.status(400).json({ ok: false, code: 400, description: 'Invalid uid.' })
    const user = await getUserByBBSUID(parseInt(req.params.uid))
    if (!user) return res.status(404).json({ ok: false, code: 404, description: 'User not found.' })
    return res.json({
        ok: true, data: {
            id: user.id,
            username: user.username
    }})
})

router.get('/bindings/minecraft/:uuid', cors(), async (req, res) => {
    if (!req.params.uuid) return res.status(400).json({ ok: false, code: 400, description: 'Missing uid.' })
    if (!req.params.uuid.match(/[0-9a-zA-Z]{32}/)) return res.status(400).json({ ok: false, code: 400, description: 'Invalid uid.' })
    const user = await getUserByMinecraftUUID(req.params.uuid)
    if (!user) return res.status(404).json({ ok: false, code: 404, description: 'User not found.' })
    return res.json({
        ok: true, data: {
            id: user.id,
            username: user.username
        }
    })
})

router.get('/bindings/telegram/:uid', cors(), async (req, res) => {
    if (!req.params.uid) return res.status(400).json({ ok: false, code: 400, description: 'Missing uid.' })
    if (isNaN(req.params.uid)) return res.status(400).json({ ok: false, code: 400, description: 'Invalid uid.' })
    const user = await getUserByTelegramUID(parseInt(req.params.uid))
    if (!user) return res.status(404).json({ ok: false, code: 404, description: 'User not found.' })
    return res.json({
        ok: true, data: {
            id: user.id,
            username: user.username
        }
    })
})

module.exports = router
