const express = require('express')

const router = express.Router()

const db = require('../helper/db/user')

const { scrypt } = require('../helper/utils/password')
const { timingSafeEqual } = require('crypto')

const bodyparser = require('body-parser')
const session_middleware = require('../middleware/session')

router.put('/password', session_middleware.session(), session_middleware.check(true), bodyparser.json(), async (req, res) => {
    // check old password
    const old_password = req.body.old_password
    if (!old_password) return res.status(400).json({ ok: false, code: 400, description: 'Old password not found' })
    const old_enc = await scrypt(old_password, req.user.salt)
    if (timingSafeEqual(req.user.password, old_enc)) return res.status(400).json({ ok: false, code: 400, description: 'Old password not match' })
    const new_password = req.body.new_password
    if (!new_password) return res.status(400).json({ ok: false, code: 400, description: 'New password not found' })
    if (old_password === new_password) return res.status(400).json({ ok: false, code: 400, description: 'New password is the same one as the olds.' })
    await db.changePassword(req.user.id, new_password)
    return res.json({ok: true})
})

router.get('/apppassword', session_middleware.session(), session_middleware.check(true), async (req, res) => {
    return res.json({ ok: true, data: req.user.app_password !== null })
})

router.put('/apppassword', session_middleware.session(), session_middleware.check(true), bodyparser.json(), async (req, res) => {
    const new_password = req.body.new_password
    if (!new_password) return res.status(400).json({ ok: false, code: 400, description: 'New password not found' })
    await db.setUserApplicationPassword(req.user.id, new_password)
    return res.json({ ok: true })
})

router.delete('/apppassword', session_middleware.session(), session_middleware.check(true), async (req, res) => {
    await db.deleteUserApplicationPassword(req.user.id)
    return res.json({ ok: true })
})

module.exports = router
