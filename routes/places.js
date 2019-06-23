const express = require('express')
const router = express.Router()
const isAuthorised = require('../validation/authorisation').isAuthorised
const autocompletePlace = require('../apis/places/autocomplete')
const savePlace = require('../apis/places/save')
const findPlace = require('../apis/places/find')

router.post('/autocomplete', isAuthorised, autocompletePlace)
router.post('/save', isAuthorised, savePlace)
router.post('/find', isAuthorised, findPlace)

module.exports = router
