const logger = require('./logger')
const jwt = require('jsonwebtoken');

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
    return response.status(400).json({ error: 'expected `username` to be unique' })
  } else if (error.name ===  'JsonWebTokenError') {
    return response.status(400).json({ error: 'token missing or invalid' })
  }

  next(error)
}

const authenticateToken = (request, response, next) => {
  console.log('Authenticate token middleware called'); // Log to confirm middleware is reached
  
  const authHeader = request.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Authorization header:', authHeader);
  console.log('Token:', token);

  if (!token) {
    return response.status(401).json({ message: 'Access token missing or invalid' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err.message); // Log error
      return response.status(403).json({ message: 'Invalid or expired token' });
    }
    
    console.log('User decoded from token:', user); // Log decoded user data
    request.user = user;
    next(); // Proceed to the next middleware or route handler
  });
};


module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  authenticateToken
}