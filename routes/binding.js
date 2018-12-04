const express = require('express')

const router = express.Router()

const bodyparser = require('body-parser')
const session_middleware = require('../middleware/session')
const recaptcha_middleware = require('../middleware/recaptcha')

const { getBBSDataByUser } = require('../helper/db/bind_bbs')
const { getMinecraftUUIDByUser } = require('../helper/db/bind_minecraft')
const { getTelegramUIDByUser } = require('../helper/db/bind_telegram')

const idp_bbs = require('../idp/bbs')
const idp_minecraft = require('../idp/minecraft_irc_remote')
const idp_telegram = require('../idp/telegram')

router.get('/bindings', session_middleware.session(), session_middleware.check(true), async (req, res) => {
    const [bbs_bind, minecraft_bind, telegram_bind] = Promise.all([getBBSDataByUser(req.user.id), getMinecraftUUIDByUser(req.user.id), getTelegramUIDByUser(req.user.id)])
    return res.json({
        ok: true,
        data: {
            bbs: bbs_bind || false,
            minecraft: minecraft_bind || false,
            telegram: telegram_bind || false
        }
    })
})

router.use('/bbs', session_middleware.session())

router.get('/bbs', session_middleware.check(true), idp_bbs.get())
router.post('/bbs', session_middleware.check(true), bodyparser.json(), recaptcha_middleware.verifyRecaptcha(true), idp_bbs.bind())
router.delete('/bbs', session_middleware.check(true), idp_bbs.unbind())

router.get('/minecraft', session_middleware.session(), session_middleware.check(true), idp_minecraft.get())
router.post('/minecraft', bodyparser.json(), idp_minecraft.bind()) // Remote binder
router.delete('/minecraft', session_middleware.session(), session_middleware.check(true), idp_minecraft.unbind())

router.use('/telegram', session_middleware.session())

router.get('/telegram', session_middleware.check(true, idp_telegram.get()))
router.post('/telegram', session_middleware.check(true), bodyparser.json(), idp_telegram.bind())
router.delete('/telegram', session_middleware.check(true), idp_telegram.unbind())

module.exports = router
