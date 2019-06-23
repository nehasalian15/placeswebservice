const db = require('../db/repository')
const response = require('../services/response')

function saveSession (sessionId, username) {
  return new Promise((resolve, reject) => {
    db.createSet(sessionId, username, 'EX', 10 * 60)
      .then((result) => {
        return resolve(true)
      })
      .catch((error) => {
        console.log('error in saving session ', error)
        return reject(response.error(500, 'Internal Server Error', []))
      })
  })
}

function checkSession (sessionId) {
  return new Promise((resolve, reject) => {
    db.getSet(sessionId)
      .then((resp) => {
        if (resp) {
          resolve(resp)
        } else {
          reject(response.error(401, 'Unauthorised access', []))
        }
      })
      .catch((err) => {
        reject(response.error(401, 'Unauthorised access', []))
      })
  })
}

function authorizeSession (sessionId) {
  return new Promise((resolve, reject) => {
    checkSession(sessionId)
      .then((username) => {
        return saveSession(sessionId, username)
      })
      .then(() => {
        resolve()
      })
      .catch((error) => {
        reject(error)
      })
  })
}

function isAuthorised (req, res, next) {
  let sessionId = req.headers.sessionid
  if (!sessionId) {
    let error = response.error(401, 'Unauthorised access', [])
    return res.status(error.code).send(error.responseData)
  }
  authorizeSession(sessionId)
    .then(() => {
      next()
    })
    .catch((error) => {
      if (!error.code) {
        error = response.error(500, 'Internal Server Error', [])
      }
      res.status(error.code).send(error.responseData)
    })
}

module.exports = {
  isAuthorised,
  saveSession,
  authorizeSession
}
