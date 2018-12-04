const express = require('express')

const router = express.Router()

const db = require('../helper/db/oauth')

const bodyparser = require('body-parser')
const session_middleware = require('../middleware/session')

router.use(session_middleware.session())

router.get('/client', session_middleware.check(true), async (req, res) => {
    const clients = await db.getClientsByUser(req.user.id)
    return res.json({ok: true, data: clients})
})

router.get('/client/:id', session_middleware.check(true), async (req, res) => {
    if (!req.params.id) return res.status(400).json({ok: false, code: 400, description: 'Client not specified'})
    const client = await db.getClient(req.params.id)
    if (!client) return res.status(404).json({ ok: false, code: 404, description: 'Client not found' })
    if (client.owner !== req.user.id) return res.status(404).json({ok: false, code: 404, description: 'Client not found'})
    return res.json({ ok: true, data: client })
})

router.post('/client/:id/resetSecret', session_middleware.check(true), async (req, res) => {
    if (!req.params.id) return res.status(400).json({ ok: false, code: 400, description: 'Client not specified' })
    const client = await db.getClient(req.params.id)
    if (!client) return res.status(404).json({ ok: false, code: 404, description: 'Client not found' })
    if (client.owner !== req.user.id) return res.status(404).json({ ok: false, code: 404, description: 'Client not found' })
    const new_secret = await db.resetClientSecret(client.client_id)
    return res.json({ok: true, data: new_secret})
})

router.post('/client/:id/purgeTokens', session_middleware.check(true), async (req, res) => {
    if (!req.params.id) return res.status(400).json({ ok: false, code: 400, description: 'Client not specified' })
    const client = await db.getClient(req.params.id)
    if (!client) return res.status(404).json({ ok: false, code: 404, description: 'Client not found' })
    if (client.owner !== req.user.id) return res.status(404).json({ ok: false, code: 404, description: 'Client not found' })
    await db.purgeAccessTokenByClient(client.client_id)
    return res.json({ ok: true })
})

router.post('/client', session_middleware.check(true), bodyparser.json(), async (req, res) => {
    // check whether parameter exists
    const app_name = req.body.app_name
    const homepage_url = req.body.homepage_url || ''
    const callback_url = req.body.callback_url || ''
    if (!app_name || !callback_url) return res.status(400).json({ ok: false, code: 400, description: 'Missing parameters.' })
    const client = await db.createClient(req.user.id, app_name, homepage_url, callback_url)
    return res.json({ok: true, data: client})
})

router.put('/client/:id', session_middleware.check(true), bodyparser.json(), async (req, res) => {
    // check whether parameter exists
    if (!req.params.id) return res.status(400).json({ok: false, code: 400, description: 'Client not specified'})
    const app_name = req.body.app_name || null
    const homepage_url = req.body.homepage_url || null
    const callback_url = req.body.callback_url || null
    if (!app_name && !homepage_url && !callback_url) return res.status(400).json({ok: false, code: 400, description: 'Specify at least one parameter.'})
    const client = await db.getClient(req.params.id)
    if (!client) return res.status(404).json({ ok: false, code: 400, description: 'Client not found' })
    if (client.owner !== req.user.id) return res.status(404).json({ ok: false, code: 404, description: 'Client not found' })
    await db.updateClient(client.client_id, app_name, homepage_url, callback_url)
    return res.json({ ok: true, data: client })
})

router.delete('/client/:id', session_middleware.check(true), async (req, res) => {
    if (!req.params.id) return res.status(400).json({ ok: false, code: 400, description: 'Client not specified' })
    const client = await db.getClient(req.params.id)
    if (!client) return res.status(404).json({ ok: false, code: 404, description: 'Client not found' })
    if (client.owner !== req.user.id) return res.status(404).json({ ok: false, code: 404, description: 'Client not found' })
    await db.deleteClient(client.client_id)
    return res.json({ ok: true })
})

module.exports = router
