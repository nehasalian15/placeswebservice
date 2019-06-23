const db = require('../../db/repository')
const response = require('../../services/response')
const validation = require('../../validation/apis/user/createValidate')
const logger = require('../../logs/logger')

function checkExistance (username) {
  return new Promise((resolve, reject) => {
    db.hgetall(username)
      .then((result) => {
        if (Object.keys(result).length !== 0)
          return reject(response.error(422, 'User Already Exists', []))

        resolve(result)
      })
      .catch((error) => {
        logger('error', 'user/create', 'checkExistance', error)
        reject(response.error(500, 'Internal Server Error', []))
      })
  })
}

function createUser (reqBody) {
  let dbValue = {
    username: reqBody.username,
    password: reqBody.password,
    name: reqBody.name
  }
  return new Promise((resolve, reject) => {
    db.createHmSet(reqBody.username, dbValue)
      .then((dbResult) => {
        return resolve(dbResult)
      })
      .catch((error) => {
        logger('error', 'user/create', 'createUser', error)
        reject(response.error(500, 'Internal Server Error', []))
      })
  })
}

function create (req, res) {
  logger('info', 'user/create', 'create', req.body)
  validation(req.body)
    .then((result) => {
      return checkExistance(req.body.username)
    })
    .then((result) => {
      return createUser(req.body)
    })
    .then((result) => {
      result = response.success(200, 'User created successfully',  {})
      logger('success', 'user/create', 'create', result)
      res.status(result.code).send(result.responseData)
    })
    .catch((error) => {
      logger('error', 'user/create', 'create', error)
      if (!error.code) {
        error = response.error(500, 'Internal Server Error', [])
      }
      res.status(error.code).send(error.responseData)
    })
}
module.exports = create
