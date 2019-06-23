const uuid = require('uuid/v4')

function generateToken () {
  var token = uuid()
  return token
}

module.exports = {
  generateToken
}
