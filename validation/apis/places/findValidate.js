const _ = require('underscore')
const response = require('../../../services/response')
const config = require('../../../config/config.json')

function findValidation (reqBody) {
  var Validator = require('jsonschema').Validator
  var v = new Validator()

  var schema = {
    'id': '/findSchema',
    'type': 'object',
    'properties': {
      'placeId': {
        'type': 'string',
        'required': true
      },
      'type': {
        'type': 'string',
        'enum': config.supportedTypes
      }
    },
    'additionalProperties': false
  }
  return new Promise((resolve, reject) => {
    let validate = v.validate(reqBody, schema)
    if (validate.errors.length === 0) {
      resolve()
    } else {
      reject(response.error(404, 'Input Validation ', _.pluck(validate.errors, 'stack')))
    }
  })
}

module.exports = findValidation
