const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  surname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  telephone: {
    type: String,
    required: true,
    match: /^00\d{1,3}\d{6,10}$/, // ensure the format starts with '00' followed by 6-13 digits
    unique: true
  },
  passwordHash: String,
  profilePicture: String,
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  connectionRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  }],
  likedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  skills: [{
    text: {
      type: String,
      maxlength: 200
    },
    public: {
      type: Boolean,
      default: true
    }
  }],
  workExperience: [{
    text: {
      type: String,
      maxlength: 200
    },
    public: {
      type: Boolean,
      default: true
    }
  }],
  education: [{
    text: {
      type: String,
      maxlength: 200
    },
    public: {
      type: Boolean,
      default: true
    }
  }],
  description: {
    type: String,
    maxlength: 1000
  },
  employmentStatus: {
    type: String,
    default: 'unemployed'  // Set default value to 'unemployed'
  },
  refreshToken: String,
  isAdmin: {
    type: Boolean,
    default: false
  },
  notifications: [{
    action: {
      type: String,  // e.g., 'liked', 'commented', 'connectionRequest'
      required: true
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  postedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }], 
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject.__v
    // the passwordHash should not be revealed
    delete returnedObject.refreshToken
    delete returnedObject.passwordHash
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User