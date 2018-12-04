const axios = require('axios')

const cache = new Map()

exports.checkBanned = async (uuid) => {
    if (cache.has(uuid)) {
        const cachedresult = cache.get(uuid)
        if (Date.now() - cachedresult.cache_time < 30*60*1000) return cachedresult.data.data.banned
    }
    const result = await axios.get(`https://stats.craft.moe/static/data/${uuid}/stats.json`)
    if (result.status !== 200) return false
    cache.set(uuid, { data: result, cache_time: Date.now() })
    return result.data.banned
}
