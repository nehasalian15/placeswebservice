const fs = require('fs')
const filePath = __dirname + '/apiLogs.json'
function log (type, apiName, functionName, data) {
  let logData = {
    type,
    apiName,
    functionName,
    data
  }
  fs.appendFileSync(filePath, JSON.stringify(logData))
}
module.exports = log
