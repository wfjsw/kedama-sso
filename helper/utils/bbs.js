const axios = require('axios')
const { url: baseUrl } = require('../../conf.d/bbs.json')

exports.loginToBBS = async (id, password) => {
    const result = await axios({
        method: 'POST',
        url: `${baseUrl}/api/token`,
        data: {
            identification: id, 
            password
        },
        validateStatus: () => true
    })
    if (result.status === 401) return false // Failed authentication
    return result.data
}

exports.getUser = async (token, id) => {
    const result = await axios.get(`${baseUrl}/api/users/${id}`, {
        headers: {
            Authorization: `Token ${token}`
        },
        validateStatus: () => true
    })
    if (result.status === 404) return false // User not found
    return result.data.data
}
