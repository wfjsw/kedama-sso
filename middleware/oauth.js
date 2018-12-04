const db = require('../helper/db/oauth')

function getBearerTokenFromHeader(header) {
    const a = header.match(/^Bearer (.+)/)
    if (!a) return false
    return a[1]
}

exports.checkAccessToken = (enforced = false) => {
    return async (req, res, next) => {
        // extract the oauth bearer token

        let token

        const authorization_header = req.get('Authorization')
        if (!authorization_header && !req.query.token && !req.body.token) {
            if (enforced) return res.status(401).json({ ok: false, code: 401, description: 'Authorization Required.' })
            else {
                req.oauth = false
                req.user = false
                return next()
            }
        } else if (authorization_header) {
            const bearer_token = getBearerTokenFromHeader(authorization_header)
            if (!bearer_token) {
                if (enforced) return res.status(401).json({ ok: false, code: 401, description: 'Authorization Required.' })
                else {
                    req.oauth = false
                    req.user = false
                    return next()
                }
            }
            token = bearer_token
        } else if (req.query.token) {
            token = req.query.token
        } else if (req.body.token) {
            token = req.body.token
        }

        const token_data = await db.getAccessToken(token)
        if (!token_data) {
            if (enforced) return res.status(401).json({ ok: false, code: 401, description: 'Invalid access token.' })
            else {
                req.oauth = false
                req.user = false
                return next()
            }
        }

        // Expiry logic built in db

        const user_data = token_data.user
        req.user = user_data
        req.oauth = token_data
        return next()
    }
}
