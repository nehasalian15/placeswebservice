const express = require('express')
const router = express.Router()
const createUser = require('../apis/user/create')
const login = require('../apis/user/login')

router.post('/create', createUser)
router.post('/login', login)

module.exports = router
