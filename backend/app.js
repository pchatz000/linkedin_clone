const config = require('./utils/config')
const express = require('express')
const app = express()
require('express-async-errors')
const cors = require('cors')
const usersRouter = require('./controllers/users')
const authRouter = require('./controllers/auth')
const postRouter = require('./controllers/post')
const conversationRouter = require('./controllers/conversation')
const jobRouter = require('./controllers/job')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

logger.info('connecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connection to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.static('dist'))
app.use(express.json())
app.use(middleware.requestLogger)

app.use('/api/users', usersRouter)
app.use('/api/auth', authRouter)
app.use('/api/post', postRouter)
app.use('/api/message', conversationRouter)
app.use('/api/job', jobRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app