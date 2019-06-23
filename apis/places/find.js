const _ = require('underscore')
const db = require('../../db/repository')
const response = require('../../services/response')
const validation = require('../../validation/apis/places/findValidate')
const config = require('../../config/config.json')
const logger = require('../../logs/logger')

function getPlace (placeId) {
  let placeData = null
  return new Promise((resolve, reject) => {
    db.hgetall(placeId)
      .then((resp) => {
        if (Object.keys(resp).length > 0) {
          placeData = resp
          let types = config.supportedTypes
          let keys = []
          for (let i in types) {
            if (resp[types[i]]) {
              keys.push(resp[types[i]])
            }
          }
          if (keys.length > 0) {
            return db.pipelineGet(keys)
          } else {
            return null
          }
        } else {
          return null
        }
      })
      .then((result) => {
        if (result) {
          return db.pipelineHgetall(_.compact(_.flatten(result)))
        } else {
          return null
        }
      })
      .then((result) => {
        if (result) {
          placeData.nearby = _.groupBy(_.compact(_.flatten(result)), (d) => {
            return d.type
          })
        }
        resolve(placeData)
      })
      .catch((error) => {
        logger('error', 'place/find', 'getPlace', error)
        return reject(response.error(500, 'Internal Server Error', error))
      })
  })
}

function find (req, res) {
  let reqBody = req.body
  logger('info', 'place/find', 'find', reqBody)
  validation(reqBody)
    .then((result) => {
      return getPlace(reqBody.placeId)
    })
    .then((result) => {
      if (!result) {
        let error = response.error(404, 'Place not found', [])
        res.status(error.code).send(error.responseData)
      } else {
        let formatedResult = {
          placeId: result.placeId,
          lat: result.lat,
          lng: result.lng,
          name: result.name,
          nearby: {}
        }
        if (reqBody.type) {
          formatedResult.nearby[reqBody.type] = result.nearby[reqBody.type]
        } else {
          formatedResult.nearby = result.nearby
        }
        let resultData = response.success(200, 'Place found successfully', formatedResult)
        logger('success', 'place/find', 'find', resultData)
        res.status(resultData.code).send(resultData.responseData)
      }
    })
    .catch((error) => {
      logger('error', 'place/find', 'find', error)
      if (!error.code) {
        error = response.error(500, 'Internal Server Error', [])
      }
      res.status(error.code).send(error.responseData)
    })
}
module.exports = find
