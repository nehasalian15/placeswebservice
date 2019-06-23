const _ = require('underscore')
const db = require('../../db/repository')
const response = require('../../services/response')
const validation = require('../../validation/apis/places/saveValidate')
const request = require('../../services/httpRequest')
const config = require('../../config/config.json')
const logger = require('../../logs/logger')

function saveNearbyPlaceData (nearByPlaces, placeData, type) {
  return new Promise((resolve, reject) => {
    db.pipelineHmset(nearByPlaces, placeData.placeId, type)
      .then((nearby) => {
        placeData.nearby = nearby
        resolve(placeData)
      })
      .catch((error) => {
        logger('error', 'place/save', 'saveNearbyPlaceData', error)
        reject(error)
      })
  })
}

function nearByPlaceDetails (lat, lon, type) {
  let url = config.awsPlaceBaseUrl + '/place/nearbysearch/json?location=' + lat + ',' + lon + '&radius=1500&type=' + type + '&key=' + config.awsKey
  return new Promise((resolve, reject) => {
    request.get(url)
      .then((resp) => {
        let result = _.map(resp.results, (locData) => {
          return {
            placeId: locData.place_id,
            lat: locData.geometry && locData.geometry.location && locData.geometry.location.lat ? locData.geometry.location.lat : 0,
            lng: locData.geometry && locData.geometry.location && locData.geometry.location.lng ? locData.geometry.location.lng : 0,
            name: locData.name,
            type
          }
        })
        resolve(result)
      })
      .catch((error) => {
        logger('error', 'place/save', 'nearByPlaceDetails', error)
        reject(response.error('500', 'Internal Server Error', [error]))
      })
  })
}

function placeDetails (placeId) {
  let url = config.awsPlaceBaseUrl + '/place/details/json?placeid=' + placeId + '&key=' + config.awsKey
  return new Promise((resolve, reject) => {
    request.get(url)
      .then((resp) => {
        let locData = resp.result
        let placeData = {
          placeId: locData.place_id,
          lat: locData.geometry && locData.geometry.location && locData.geometry.location.lat ? locData.geometry.location.lat : 0,
          lng: locData.geometry && locData.geometry.location && locData.geometry.location.lng ? locData.geometry.location.lng : 0,          
          name: locData.formatted_address
        }
        resolve(placeData)
      })
      .catch((error) => {
        logger('error', 'place/save', 'placeDetails', error)
        reject(response.error('500', 'Internal Server Error', [error]))
      })
  })
}

function savePlaceData (placeData) {
  return new Promise((resolve, reject) => {
    db.createHmSet(placeData.placeId, placeData)
      .then((result) => {
        resolve()
      })
      .catch((error) => {
        logger('error', 'place/save', 'savePlaceData', error)
        reject(error)
      })
  })
}

function getNewPlaceData (placeId, type) {
  let placeData = {}
  return new Promise((resolve, reject) => {
    placeDetails(placeId)
      .then((result) => {
        placeData = result
        return savePlaceData(placeData)
      })
      .then((result) => {
        return getNearByPlace(placeData, type)
      })
      .then((result) => {
        resolve(result)
      })
      .catch((error) => {
        logger('error', 'place/save', 'getNewPlaceData', error)
        reject(error)
      })
  })
}

// get new nearby place details
function getNearByPlace (placeData, type) {
  return new Promise((resolve, reject) => {
    nearByPlaceDetails(placeData.lat, placeData.lng, type)
      .then((result) => {
        return saveNearbyPlaceData(result, placeData, type)
      })
      .then((result) => {
        resolve(result)
      })
      .catch((error) => {
        logger('error', 'place/save', 'getNearByPlace', error)
        reject(error)
      })
  })
}

// get place data from database
function getPlaceDataFromDb (placeId, type) {
  let placeData = null
  return new Promise((resolve, reject) => {
    db.hgetall(placeId)
      .then((result) => {
        if (Object.keys(result).length > 0) {
          placeData = result
          if (result[type]) {
            return db.lrange(result[type])
          } else {
            return null
          }
        } else {
          return null
        }
      })
      .then((result) => {
        if (result) {
          placeData.nearby = result
        }
        resolve(placeData)
      })
      .catch((error) => {
        logger('error', 'place/save', 'getPlaceDataFromDb', error)
        reject(response.error(500, 'Internal Server Error', error))
      })
  })
}

// get place data
function getPlaceData (data) {
  return new Promise((resolve, reject) => {
    getPlaceDataFromDb(data.placeId, data.type)
      .then((result) => {
        if (result) {
          if (result.nearby) {
            return result
          } else {
            return getNearByPlace(result, data.type)
          }
        } else {
          return getNewPlaceData(data.placeId, data.type)
        }
      })
      .then((result) => {
        resolve(result)
      })
      .catch((error) => {
        logger('error', 'place/save', 'getPlaceData', error)
        reject(response.error(500, 'Internal Server Error', error))
      })
  })
}

function save (req, res) {
  let reqBody = req.body
  logger('info', 'place/save', 'save', reqBody)
  validation(reqBody)
    .then((result) => {
      return getPlaceData(reqBody)
    })
    .then((result) => {
      let formatedRes = {
        placeId: result.placeId,
        latitute: result.lat,
        longitude: result.lng,
        placeName: result.name,
        nearByPlaces: result.nearby
      }
      let resultData = response.success(200, 'Place saved successfully', formatedRes)
      logger('success', 'place/save', 'save', resultData)
      res.status(resultData.code).send(resultData.responseData)
    })
    .catch((error) => {
      logger('error', 'place/save', 'save', error)
      if (!error.code) {
        error = response.error(500, 'Internal Server Error', [])
      }
      res.status(error.code).send(error.responseData)
    })
}
module.exports = save
