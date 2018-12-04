const { realip_header } = require('../config.json')
const net = require('net')

exports.resolveRealIP = (enforced = false) => {
    return async (req, res, next) => {
        if (!realip_header) next()
        const realip = req.get(realip_header)
        if (!realip) {
            if (enforced) {
                return res.sendStatus(400)
            } else {
                req.original_ip = req.ip
                return next()
            }
        }
        // validate
        const is_vaild = net.isIP(realip)
        if (!is_vaild) {
            if (enforced) {
                return res.sendStatus(400)
            } else {
                req.original_ip = req.ip
            }
        }
        req.original_ip = req.ip
        req.ip = realip
        return next()
    }
}
