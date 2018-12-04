const express = require('express')

const router = express.Router()

const dbu = require('../helper/db/user')
const dbo = require('../helper/db/oauth')

const bodyparser = require('body-parser')
const session_middleware = require('../middleware/session')
const recaptcha_middleware = require('../middleware/recaptcha')

const { getBBSDataByUser } = require('../helper/db/bind_bbs')
const { getMinecraftUUIDByUser } = require('../helper/db/bind_minecraft')
const { getTelegramUIDByUser } = require('../helper/db/bind_telegram')

router.use('/login', session_middleware.session())
router.use('/logout', session_middleware.session())
router.use('/signup', session_middleware.session())

router.get('/login', session_middleware.check(false), async (req, res) => {
    // serve static page
    if (req.user) return res.redirect('/')
    return res.sendFile('views/login.html', {root: __dirname + '/../'})
})

router.post('/login', session_middleware.check(false), (req, res, next) => {
    if (req.user) return res.status(403).json({ ok: false, code: 403, description: 'Already logged in' })
    return next()
}, bodyparser.json(), recaptcha_middleware.verifyRecaptcha(true), session_middleware.login(), (req, res) => res.json({ok: true}).end())

router.get('/logout', session_middleware.session(), session_middleware.check(true, '/login'), async (req, res) => {
    return res.sendFile('views/logout.html', { root: __dirname + '/../' })
})

router.post('/logout', session_middleware.session(), session_middleware.check(true, '/login'), session_middleware.logout(), (req, res) => res.json({ ok: true }))

router.post('/signup', session_middleware.session(), session_middleware.check(false), (req, res, next) => {
    if (req.user) return res.status(403).json({ ok: false, code: 403, description: 'Already logged in' })
    return next()
}, bodyparser.json(), recaptcha_middleware.verifyRecaptcha(true), session_middleware.signup(), (req, res) => res.json({ ok: true }).end())

router.get('/checkUsername', async (req, res) => {
    const username = req.query.username
    if (!username) return res.json({ ok: true, data: true })
    const user = await dbu.getUserByName(username)
    return res.json({ok: true, data: !!user})
})

router.get('/editclient', session_middleware.session(), session_middleware.check(true, '/login'), async (req, res) => {
    const client_id = req.query.client_id
    const type = client_id ? 'edit' : 'new'
    if (client_id) {
        const client = await dbo.getClient(client_id)
        if (client.owner !== req.user.id) return res.sendStatus(404)
        return res.render('edit_client', {
            type,
            client_id: client.client_id,
            client_secret: client.client_secret,
            app_name: client.app_name || '',
            homepage_url: client.homepage_url || '',
            callback_url: client.callback_url || ''
        })
    } else {
        return res.render('edit_client', {
            type: 'new',
            app_name: '',
            homepage_url: '',
            callback_url: ''
        })
    }
})

router.get('/', session_middleware.session(), session_middleware.check(true, '/login'), async (req, res) => {
    const [bbs_bind, minecraft_bind, telegram_bind] = await Promise.all([getBBSDataByUser(req.user.id), getMinecraftUUIDByUser(req.user.id), getTelegramUIDByUser(req.user.id)])
    const clients = await dbo.getClientsByUser(req.user.id)
    return res.render('index', {
        username: req.user.username,
        token: req.user.token,
        bbs_binded: !!bbs_bind,
        bbs_id: bbs_bind.id,
        bbs_name: bbs_bind.name,
        minecraft_binded: !!minecraft_bind,
        minecraft_id: minecraft_bind,
        telegram_binded: !!telegram_bind,
        telegram_id: telegram_bind,
        clients,
        app_password: req.user.app_password
    })
})

module.exports = router
