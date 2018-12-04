const { Pool } = require('pg')
const { database } = require('../../config.json')

const db = new Pool(database)

module.exports = db

