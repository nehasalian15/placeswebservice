const _ = require('underscore')
const response = require('../../services/response')
const validation = require('../../validation/apis/places/autocompleteValidate')
const request = require('../../services/httpRequest')
const config = require('../../config/config.json')
const logger = require('../../logs/logger')

function placeAutocomplete (placeName) {
  let url = config.awsPlaceBaseUrl + '/place/autocomplete/json?input=' + placeName + '&key=' + config.awsKey + '&placeIdOnly=true'
  return new Promise((resolve, reject) => {
    request.get(url)
      .then((resp) => {
        let predictions = resp && resp.predictions ? resp.predictions : []
        let funcResponse = _.map(predictions, (p) => {
          return {
            placeName: p.description,
            placeId: p.place_id
          }
        })
        resolve(funcResponse)
      })
      .catch((error) => {
        logger('error', 'place/autocomplete', 'placeAutocomplete', error)
        reject(response.error('500', 'Internal Server Error', [error]))
      })
  })
}

function autocomplete (req, res) {
  let reqBody = req.body
  logger('info', 'place/autocomplete', 'autocomplete', reqBody)
  validation(reqBody)
    .then((result) => {
      return placeAutocomplete(reqBody.place)
    })
    .then((result) => {
      let resultData = response.success(200, 'User created successfully', result)
      logger('success', 'place/autocomplete', 'autocomplete', resultData)
      res.status(resultData.code).send(resultData.responseData)
    })
    .catch((error) => {
      logger('error', 'place/autocomplete', 'autocomplete', error)
      if (!error.code) {
        error = response.error(500, 'Internal Server Error', [])
      }
      res.status(error.code).send(error.responseData)
    })
}
module.exports = autocomplete
