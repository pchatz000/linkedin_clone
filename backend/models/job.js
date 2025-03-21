const mongoose = require('mongoose');

const jobSchema = mongoose.Schema({
  authorID: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  applicants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
