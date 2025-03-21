const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
	user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	messages: [{
	  content: { type: String, required: true },
	  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	  timestamp: { type: Date, default: Date.now }
	}],
	lastUpdated: { type: Date, default: Date.now }
});
  
const Conversation = mongoose.model('Conversation', conversationSchema)

module.exports = Conversation