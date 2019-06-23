const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser')

const userRoutes = require('./routes/users')
const placeRoutes = require('./routes/places')

// Body Parser Middleware
app.use(bodyParser.json())

app.use('/user', userRoutes)
app.use('/place', placeRoutes)

app.listen(port, () => console.log(`Listening on port ${port}!`))
