const cluster = require('cluster')
const numCPUs = require('os').cpus().length

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`)

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork()
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died. restarting...`)
        cluster.fork()
    })
} else {
    console.log(`Worker ${process.pid} online`)
    const express = require('express')

    const { host, port } = require('./config.json')

    const RApi = require('./routes/api')
    const RBinding = require('./routes/binding')
    const RIndex = require('./routes/index')
    const ROauthClient = require('./routes/oauthclient')
    const RSSO = require('./routes/sso')
    const RUserCtl = require('./routes/userctl')

    const MRealIp = require('./middleware/realip')

    const app = express()

    app.use(MRealIp.resolveRealIP(true))

    app.engine('ejs', require('ejs').renderFile)
    app.set('view engine', 'ejs')
    app.set('views', './views')
    app.set('x-powered-by', false)

    const static_options = {
        dotfiles: 'ignore',
        fallthrough: true,
        index: false,
        immutable: true,
        maxAge: '365d',
        redirect: false
    }

    app.use('/static', express.static('static', static_options))

    app.use('/api', RApi)
    app.use('/binding', RBinding)
    app.use('/oauthClient', ROauthClient)
    app.use('/sso', RSSO)
    app.use('/user', RUserCtl)
    app.use('/', RIndex)

    app.use(async (req, res) => {
        return res.sendStatus(404)
    })

    app.listen(port, host)
}
