const request = require('request')
const response = require('../services/response')

function post (url, body, sessionid) {
  let postOptions = {
    url,
    method: 'POST',
    body: body,
    json: true
  }
  return new Promise((resolve, reject) => {
    request(postOptions, (err, res, body) => {
      if (err) {
        return reject(err)
      }
      
      if(typeof body === 'string')
        resolve(JSON.parse(body))
      else 
        resolve(body)
    })
  })
}

function get (url, sessionid) {
  let postOptions = {
    url: url,
    method: 'GET'
  }
  return new Promise((resolve, reject) => {
    request(postOptions, (err, res, body) => {
      if (err)
        return reject(response.error('500', 'Internal Server Eror', []))

      if(typeof body === 'string')
        resolve(JSON.parse(body))
      else 
        resolve(body) 
    })   
  })
}

module.exports = {
  get,
  post
}
