const axios = require('axios')

exports.nameToUUID = async (name) => {
    const result = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${name}`)
    if ('id' in result.data) return result.data.id
    else return false
}
