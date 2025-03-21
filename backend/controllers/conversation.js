const express = require('express');
const conversationRouter = express.Router();
const Conversation = require('../models/conversation');
const User = require('../models/user')
const middlewares = require('../utils/middleware.js');

const authenticateToken = middlewares.authenticateToken;

// start or continue conversation
conversationRouter.post('/send', authenticateToken, async (request, response) => {
	try {
	  const { recipientId, content } = request.body;
	  const senderId = request.user._id;
  
	  let conversation = await Conversation.findOne({
		$or: [
		  { user1: senderId, user2: recipientId },
		  { user1: recipientId, user2: senderId }
		]
	  });
  
	  if (!conversation) {
		conversation = new Conversation({
		  user1: senderId,
		  user2: recipientId,
		  messages: []
		});
	  }
  
	  conversation.messages.push({
		content,
		sender: senderId
	  });
  
	  conversation.lastUpdated = Date.now();
	  await conversation.save();
  
	  response.status(201).json({ message: 'Message sent successfully', conversationId: conversation._id });
	} catch (error) {
	  response.status(500).json({ error: 'Failed to send message' });
	}
});

conversationRouter.get('/', authenticateToken, async (request, response) => {
	try {
	  const conversations = await Conversation.find({
		$or: [{ user1: request.user._id }, { user2: request.user._id }]
	  })
	  .populate('user1', 'username')
	  .populate('user2', 'username')
	  .sort('-lastUpdated');
  
	  const result = conversations.map(conversation => {
		const otherUser = conversation.user1._id.equals(request.user._id) ? conversation.user2 : conversation.user1;
  
		return {
		  user: {
			_id: otherUser._id,
			username: otherUser.username,
		  },
		  conversationId: conversation._id
		};
	  });
  
	  response.json(result);
	} catch (error) {
	  console.error(error);
	  response.status(500).json({ error: 'Failed to fetch conversations' });
	}
});

conversationRouter.get('/:id', authenticateToken, async (request, response) => {
	try {
	  const conversation = await Conversation.findOne({
		_id: request.params.id,
		$or: [{ user1: request.user._id }, { user2: request.user._id }]
	  })
	  .populate('user1', 'name email')
	  .populate('user2', 'name email');
  
	  if (!conversation) {
		return response.status(404).json({ error: 'Conversation not found' });
	  }
  
	  response.json(conversation);
	} catch (error) {
	  response.status(500).json({ error: 'Failed to fetch conversation' });
	}
});
  
module.exports = conversationRouter