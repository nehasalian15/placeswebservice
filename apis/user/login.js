const commonService = require('../../services/commonServices')
const db = require('../../db/repository')
const response = require('../../services/response')
const validation = require('../../validation/apis/user/loginValidate')
const authorize = require('../../validation/authorisation')
const logger = require('../../logs/logger')

function updateUserSession (sessionId, username) {
  let dbValue = {
    sessionId
  }
  return new Promise((resolve, reject) => {
    db.createHmSet(username, dbValue)
      .then((dbResult) => {
        return resolve(dbResult)
      })
      .catch((error) => {
        logger('error', 'user/login', 'updateUserSession', error)
        reject(response.error(500, 'Internal Server Error', []))
      })
  })
}

function createSessionId (userData) {
  let sessionId = commonService.generateToken()
  return new Promise((resolve, reject) => {
    authorize.saveSession(sessionId, userData.username)
      .then((result) => {
        return updateUserSession(sessionId, userData.username)
      })
      .then(() => {
        userData.sessionId = sessionId
        return resolve(userData)
      })
      .catch((error) => {
        logger('error', 'user/login', 'createSessionId', error)
        reject(response.error(500, 'Internal Server Error', []))
      })
  })
}

function validateUser (reqBody) {
  return new Promise((resolve, reject) => {
    db.hgetall(reqBody.username)
      .then((result) => {
        if (Object.keys(result).length === 0)
          return reject(response.error(404, 'User does not exist', []))
        
        if (result.username === reqBody.username && result.password === reqBody.password) {
          resolve({
            username: result.username,
            name: result.name,
            sessionId: result.sessionId
          })
        } else {
          reject(response.error(401, 'Invalid Username or password', []))
        }
      })
      .catch((error) => {
        logger('error', 'user/login', 'validateUser', error)
        reject(response.error(500, 'Internal Server Error', []))
      })
  })
}

function authorizeSession (userData) {
  return new Promise((resolve, reject) => {
    authorize.authorizeSession(userData.sessionId)
      .then((result) => {
        resolve(result)
      })
      .catch((error) => {
        logger('error', 'user/login', 'authorizeSession', error)
        if (error.code === 401) {
          return createSessionId(userData)
            .then((resp) => {
              resolve(resp)
            })
            .catch((error1) => {
              reject(error1)
            })
        } else {
          reject(response.error(500, 'Internal Server Error', []))
        }
      })
  })
}

function login (req, res) {
  logger('info', 'user/login', 'login', req.body)
  let userData = {}
  validation(req.body)
    .then((result) => {
      return validateUser(req.body)
    })
    .then((result) => {
      userData = result
      if (userData.sessionId) {
        return authorizeSession(userData)
      } else {
        return createSessionId(userData)
      }
    })
    .then((resData) => {
      if (!userData.sessionId)
        userData = resData
      let result = response.success(200, 'User loggedIn successfully', userData)
      logger('success', 'user/login', 'login', result)
      res.status(result.code).send(result.responseData)
    })
    .catch((error) => {
      logger('error', 'user/login', 'login', error)
      if (!error.code) {
        error = response.error(500, 'Internal Server Error', [])
      }
      res.status(error.code).send(error.responseData)
    })
}
module.exports = login
