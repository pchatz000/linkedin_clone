const mongoose = require('mongoose')

const postSchema = mongoose.Schema({
  authorID: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
	maxlength: 500
  },
  mediaURL: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  comments: [{
    text: {
      type: String,
      required: true
    },
    commenterID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
})

const Post = mongoose.model('Post', postSchema)

module.exports = Post