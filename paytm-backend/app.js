const express = require('express')
const app = express()
const cors = require('cors')
const paymentRoute = require('./paymentRoute')
 const bodyParser = require('body-parser')


const port = 5000
app.use(cors())
app.use(bodyParser.json())
app.use('/api', paymentRoute)

app.listen(port, () => {
    console.log('APP IS RUNNING')
})