const Redis = require('ioredis')
const redisConnection = require('../config/dbConfig').redis
module.exports.redis = new Redis(redisConnection)
