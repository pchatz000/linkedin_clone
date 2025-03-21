const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const authRouter = require('express').Router()
const User = require('../models/user')

const accessTokenLife = '1h'; // Access token lifespan
const refreshTokenLife = '7d'; // Refresh token lifespan

const middlewares = require('../utils/middleware.js');

const authenticateToken = middlewares.authenticateToken;

authRouter.post('/login', async (request, response) => {
  const { username, password } = request.body
  try {
    const user = await User.findOne({ username })
    const passwordCorrect = user === null
      ? false
      : await bcrypt.compare(password, user.passwordHash)

    if (!(user && passwordCorrect)) {
      return response.status(401).json({
        error: 'invalid username or password'
      })
    }

    const userForToken = { _id: user._id }
    console.log(userForToken)

    const accessToken = jwt.sign(userForToken, process.env.ACCESS_TOKEN_SECRET, { expiresIn: accessTokenLife })
    const refreshToken = jwt.sign(userForToken, process.env.REFRESH_TOKEN_SECRET, { expiresIn: refreshTokenLife })
    
    user.refreshToken = refreshToken
    await user.save()
    
    response
      .status(200)
      .send({ accessToken, refreshToken, id: user._id })
  }
  catch (err) {
    response.status(500).json({message: "Server Error"})
  }
})

authRouter.post('/logout', authenticateToken, async (request, response) => {
  try {
    const userId = request.user._id; 

    const user = await User.findById(userId);
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    user.refreshToken = null;
    await user.save();

    response.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Error during logout:', err);
    response.status(500).json({ message: 'Server error' });
  }
});


authRouter.post('/refresh', async (request, response) => {
  const { refreshToken } = request.body;
  if (!refreshToken) return response.status(401).json({ message: 'Refresh Token is required' });
  try {
    const user = await User.findOne({ refreshToken });
    if (!user) return response.status(403).json({ message: 'Invalid refresh token' });
    console.log(user)
    const userForToken = { _id: user._id }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return response.status(403).json({ message: 'Invalid refresh token' });

      const accessToken = jwt.sign(userForToken, process.env.ACCESS_TOKEN_SECRET, { expiresIn: accessTokenLife })
      response.json({ accessToken });
    });
  } catch (err) {
    response.status(500).json({ message: 'Server error' });
  }
});

module.exports = authRouter