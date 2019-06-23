const Redis = require('ioredis')
const redisConnection = require('../config/dbConfig').redis
const redis = new Redis(redisConnection)

function pipelineHmset (data, placeId, type) {
  return new Promise((resolve, reject) => {
    let pipeline = redis.pipeline()
    let nearby = []
    for (let i in data) {
      pipeline.hmset(data[i].placeId, data[i])
      pipeline.lpush('nearby::' + type + '::' + placeId, data[i].placeId)
      nearby.push(data[i].placeId)
    }
    pipeline.hmset(placeId, type, 'nearby::' + type + '::' + placeId)
    pipeline.exec(function (err, results) {
      console.log('in pipeline response ---------- ', err)
      resolve(nearby)
      pipeline.del()
    })
  })
}

function pipelineGet (data) {
  return new Promise((resolve, reject) => {
    let pipeline = redis.pipeline()
    for (let i in data) {
      pipeline.lrange(data[i], 0, -1)
    }
    pipeline.exec(function (err, results) {
      resolve(results)
      pipeline.del()
    })
  })
}

function pipelineHgetall (data) {
  return new Promise((resolve, reject) => {
    let pipeline = redis.pipeline()
    for (let i in data) {
      pipeline.hgetall(data[i])
    }
    pipeline.exec(function (err, results) {
      resolve(results)
      pipeline.del()
    })
  })
}

function lrange (key) {
  return new Promise((resolve, reject) => {
    redis.lrange(key, 0, -1, (err, resp) => {
      if (err)
        return reject(err)

      resolve(resp)
    })
  })
}

function createHmSet (key, value) {
  return new Promise((resolve, reject) => {
    redis.hmset(key, value, (err, resp) => {
      if (err)
        return reject(err)

      resolve(true)
    })
  })
}

function createSet (...data) {
  return new Promise((resolve, reject) => {
    redis.set(data, (err, resp) => {
      if (err)
        return reject(err)

      resolve(true)
    })
  })
}

function getSet (key) {
  return new Promise((resolve, reject) => {
    redis.get(key, (err, resp) => {
      if (err)
        return reject(err)

      resolve(resp)
    })
  })
}

function hgetall (key) {
  return new Promise((resolve, reject) => {
    redis.hgetall(key, (err, resp) => {
      if (err)
        return reject(err)

      resolve(resp)
    })
  })
}

function hget (...data) {
  return new Promise((resolve, reject) => {
    redis.hgetall(data, (err, resp) => {
      if (err)
        return reject(err)

      resolve(resp)
    })
  })
}

module.exports = {
  createSet,
  hgetall,
  createHmSet,
  getSet,
  hget,
  pipelineHmset,
  lrange,
  pipelineGet,
  pipelineHgetall
}
