const crypto = require('crypto')
const { bot_token } = require('../../conf.d/telegram.json')

const secret_key = crypto.createHash('sha256').update(bot_token).digest()

exports.verifySignature = (data, timeout = 0) => {
    data = JSON.parse(JSON.stringify(data))
    const input_hash = data.hash.toLowerCase()
    delete data.hash
    let array = []
    for (let key in data) {
        array.push(key + '=' + data[key])
    }
    const check_string = array.sort().join('\n')
    const check_hash = crypto.createHmac('sha256', secret_key).update(check_string).digest().toString('hex').toLowerCase()
    if (check_hash === input_hash) {
        if (timeout > 0) {
            const date_offset = Math.floor(Date.now() / 1000) - data.auth_date
            if (date_offset > timeout) return false
        }
        return true
    } else {
        return false
    }
}
