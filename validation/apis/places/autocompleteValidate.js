const _ = require('underscore')
const response = require('../../../services/response')

function autocompleteValidation (reqBody) {
  var Validator = require('jsonschema').Validator
  var v = new Validator()

  var schema = {
    'id': '/autocompleteSchema',
    'type': 'object',
    'properties': {
      'place': {
        'type': 'string',
        'required': true
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

module.exports = autocompleteValidation
