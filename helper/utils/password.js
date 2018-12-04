const crypto = require('crypto')

exports.genSalt = () => crypto.randomBytes(16)

exports.scrypt = (password, salt) => {
    return new Promise((rs, rj) => {
        crypto.scrypt(password, salt, 32, (e, dK) => {
            if (e) rj(e)
            rs(dK)
        })
    })
}
