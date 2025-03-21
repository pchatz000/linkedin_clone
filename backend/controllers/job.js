const express = require('express');
const Job = require('../models/job');
const User = require('../models/user');

const { authenticateToken } = require('../utils/middleware'); 

const jobRouter = express.Router();

// create a job
jobRouter.post('/', authenticateToken, async (request, response) => {
	const { title, description, location, companyName } = request.body;
	const authorID = request.user._id;
  
	if (!title || !description || !location || !companyName) {
	  return response.status(400).json({ message: 'All fields are required' });
	}
  
	const job = new Job({
	  authorID,
	  title,
	  description,
	  location,
	  companyName
	});
  
	try {
	  const savedJob = await job.save();
  
	  await User.findByIdAndUpdate(
		authorID,
		{ $push: { postedJobs: savedJob._id } },
		{ new: true }
	  );
  
	  response.status(201).json(savedJob);
	} catch (error) {
	  console.error(error);
	  response.status(500).json({ message: 'Server error', error });
	}
  });

// apply to job
jobRouter.post('/apply/:jobId', authenticateToken, async (request, response) => {
const { jobId } = request.params;
const applicantId = request.user._id;

try {
	const job = await Job.findById(jobId);

	if (!job) {
	return response.status(404).json({ message: 'Job not found' });
	}

	// check if the user has already applied
	if (job.applicants.includes(applicantId)) {
	return response.status(400).json({ message: 'You have already applied for this job' });
	}

	job.applicants.push(applicantId);
	await job.save();

	await User.findByIdAndUpdate(
	applicantId,
	{ $push: { appliedJobs: jobId } },
	{ new: true }
	);

	response.status(200).json({ message: 'Application successful', job });
} catch (error) {
	console.error(error);
	response.status(500).json({ message: 'Server error', error });
}
});

// get job ads
jobRouter.get('/feed', authenticateToken, async (request, response) => {
const userId = request.user._id;

try {
	const user = await User.findById(userId).populate('connections');

	if (!user) {
	return response.status(404).json({ message: 'User not found' });
	}

	// get all jobs posted by the user's connected users
	const connectedUserIds = user.connections.map(connection => connection._id);

	const jobs = await Job.find({ authorID: { $in: connectedUserIds } }).select('_id');

	response.status(200).json(jobs.map(job => job._id));
} catch (error) {
	console.error(error);
	response.status(500).json({ message: 'Server error', error });
}
});

// get full job ad
jobRouter.get('/info/:jobId', authenticateToken, async (request, response) => {
	const { jobId } = request.params;
  
	try {
	  // find the job by its ID
	  const job = await Job.findById(jobId).populate('authorID', 'username name').populate('applicants', 'username name');
  
	  if (!job) {
		return response.status(404).json({ message: 'Job not found' });
	  }
  
	  response.status(200).json(job);
	} catch (error) {
	  console.error(error);
	  response.status(500).json({ message: 'Server error', error });
	}
});

// see applicants for specific post
jobRouter.get('/applicants/:jobId', authenticateToken, async (request, response) => {
	const { jobId } = request.params;
	const userId = request.user._id;
  
	try {
	  const job = await Job.findById(jobId);
  
	  if (!job) {
		return response.status(404).json({ message: 'Job not found' });
	  }
  
	  if (job.authorID.toString() !== userId.toString()) {
		return response.status(403).json({ message: 'You are not authorized to view applicants for this job' });
	  }
  
	  response.status(200).json(job.applicants.map(applicant => applicant.toString()));
	} catch (error) {
	  console.error(error);
	  response.status(500).json({ message: 'Server error', error });
	}
});
  



module.exports = jobRouter;
