function error (code, message, error) {
  return {
    code,
    responseData: {
      message,
      error
    }
  }
}

function success (code, message, data) {
  return {
    code,
    responseData: {
      message,
      data
    }
  }
}

module.exports = {
  success,
  error
}
