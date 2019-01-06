// ReCaptcha v2(invisible) verify request

const axios = require('axios')

const {recaptcha_secret} = require('../config.json')

exports.verifyRecaptcha = (enforced = true, responseField = 'g-recaptcha-response') => {
    return async (req, res, next) => {
        // res.recaptcha.is_present, is_checked, timestamp, hostname
        // g-recaptcha-response in the body
        // Make sure to parse the body first.
        if (!req.body) throw new Error('ReCaptcha Check: Body not parsed.')
        const resp = req.body[responseField]
        if (!resp) {
            if (enforced) {
                // Captcha not present.
                return res.status(403).json({ ok: false, code: 403, description: 'Invalid reCaptcha response.' })
            } else {
                req.recaptcha = {
                    is_present: false,
                    is_checked: false
                }
                return next()
            }
        }
        const validation_data = await axios({
            url: 'https://www.google.com/recaptcha/api/siteverify',
            method: 'POST',
            data: new URLSearchParams({
                secret: recaptcha_secret,
                response: resp,
                remoteip: req.ip
            }),
            validateStatus: () => true
        })
        if (validation_data.data.success) {
            req.recaptcha = {
                is_present: true,
                is_checked: true,
                timestamp: validation_data.data.challenge_ts,
                hostname: validation_data.data.hostname
            }
            return next()
        } else {
            if (enforced) {
                // Captcha not valid.
                return res.status(403).json({ ok: false, code: 403, description: 'Invalid reCaptcha response.'})
            } else {
                req.recaptcha = {
                    is_present: true,
                    is_checked: false
                }
                return next()
            }
        }
    }
}
