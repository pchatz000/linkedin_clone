const bcrypt = require('bcrypt');
const multer = require('multer');
const express = require('express');
const usersRouter = require('express').Router();
const User = require('../models/user');
const path = require('path');
const middlewares = require('../utils/middleware.js');
const js2xmlparser = require("js2xmlparser");

const authenticateToken = middlewares.authenticateToken;

const pfpStorage = multer.diskStorage({
  destination: (request, file, cb) => {
  cb(null, 'uploads/profile-pictures'); // store in 'uploads/profile-pictures' folder
  },
  filename: (request, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // unique filename with timestamp
  }
});

const upload = multer({ 
  storage: pfpStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // limit file size to 10 megabytes
  fileFilter: (request, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('File uploaded is not an image. Only images are allowed.'));
    }
  }
});

usersRouter.use('/uploads/profile-pictures', express.static('uploads/profile-pictures'));

usersRouter.post('/profile-picture', authenticateToken, upload.single('profilePicture'), async (request, response) => {
  try {
    const userId = request.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    user.profilePicture = `/uploads/profile-pictures/${request.file.filename}`;
    await user.save();

    response.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: 'Server error', error });
  }
});

// testing
usersRouter.get('/check-auth', authenticateToken, (request, response) => {
  console.log("yes")
  if (!request.user) {
    return response.status(404).json({ message: 'User not found' });
  }

  return response.status(200).json({
    message: 'User authenticated successfully',
    user: request.user  // This should contain the user data (e.g., id)
  });
});

// get all users
usersRouter.get('/', async (request, response) => {
  try {
    const users = await User.find({}).lean();

    const acceptHeader = request.headers['accept'];

    if (acceptHeader && acceptHeader.includes('application/xml')) {
      // transform connections, skills, and other arrays to XML-friendly structure
      const usersForXml = users.map(user => {
        return {
          ...user,
          connections: { connection: user.connections.map(conn => conn.toString()) },
          likedPosts: { likedPost: user.likedPosts.map(post => post.toString()) },
          skills: { skill: user.skills },  
          workExperience: { workExperience: user.workExperience },  
          education: { education: user.education },
          connectionRequests: {
            connectionRequest: user.connectionRequests.map(req => ({
              from: req.from.toString(),
              status: req.status
            }))
          }
        };
      });

      const xml = js2xmlparser.parse("users", usersForXml);
      response.set('Content-Type', 'application/xml');
      response.send(xml);
    } else {
      // default to JSON if no XML requested
      response.json(users);
    }
  } catch (error) {
    console.error("Error retrieving users:", error);
    response.status(500).json({ error: 'Failed to retrieve users' });
  }
});



// register new user
usersRouter.post('/register', async (request, response) => {
  try {
    const { username, name, surname, email, password, telephone } = request.body;

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = new User({
      username,
      name,
      surname,
      email,
      passwordHash,
      telephone
    });

    const savedUser = await user.save();

    response.status(201).json({ user: savedUser });
  } catch (error) {
    console.error('Error during registration:', error);

    response.status(500).json({ message: 'Server error', error });
  }
});


// get user info by id
usersRouter.get('/info/:userId', authenticateToken, async (request, response) => {
  const userId = request.params.userId;
  const requestingUserId = request.user._id;

  try {
    const requestedUser = await User.findById(userId).lean();
    const requestingUser = await User.findById(requestingUserId).lean();

    if (!requestedUser || !requestingUser) {
      return response.status(404).json({ message: 'User not found' });
    }

    const isAdmin = requestingUser.isAdmin;
    const isConnected = requestedUser.connections.some(
      (connection) => connection.equals(requestingUserId)
    );
    const isSameUser = requestedUser._id.equals(requestingUser._id);
    if (isSameUser || isAdmin) {
      // return full user details if admin  or the same
      return response.status(200).json(requestedUser);
    }
    if (isConnected) {
      const connectedInfo = {
          username: requestedUser.username,
          name: requestedUser.name,
          surname: requestedUser.surname,
          profilePicture: requestedUser.profilePicture,
          description: requestedUser.description,
          skills: requestedUser.skills,
          workExperience: requestedUser.workExperience,
          education: requestedUser.education,
          connections: requestedUser.connections,
          email: requestedUser.email,
          telephone: requestedUser.telephone
        }
        return response.status(200).json(connectedInfo);
    }

    // if not connected and not admin, return only public information
    const publicInfo = {
      username: requestedUser.username,
      name: requestedUser.name,
      surname: requestedUser.surname,
      profilePicture: requestedUser.profilePicture,
      description: requestedUser.description,
      skills: requestedUser.skills.filter((skill) => skill.public),
      workExperience: requestedUser.workExperience.filter((exp) => exp.public),
      education: requestedUser.education.filter((edu) => edu.public),
    };

    response.status(200).json(publicInfo);
  } catch (err) {
    response.status(500).json({ message: 'Server error', error: err });
  }
});


// #### connection handling endpoints ####

// send connection request
usersRouter.post('/connect/:userId', authenticateToken, async (request, response) => {
  const { userId } = request.params; 
  const fromUserId = request.user._id; 

  try {
    const targetUser = await User.findById(userId);
    const fromUser = await User.findById(fromUserId);

    if (!targetUser || !fromUser) {
      return response.status(404).json({ message: 'User not found' });
    }

    // check if a request already exists
    const existingRequest = targetUser.connectionRequests.find(
      (request) => request.from.toString() === fromUserId.toString()
    );

    if (existingRequest) {
      return response.status(400).json({ message: 'Connection request already sent' });
    }

    const existingOppositeRequest = fromUser.connectionRequests.find(
      (request) => request.from.toString() === fromUserId.toString()
    );
    
    if (existingOppositeRequest) {
      return response.status(400).json({ message: 'The user has requested to connect with you, answer the request' });
    }
    // add connection request to target user's connectionRequests array
    targetUser.connectionRequests.push({ from: fromUserId, status: 'pending' });
    
    // add to notifications
    targetUser.notifications.push({
      action: 'connectionRequest',
      from: fromUserId
    });


    await targetUser.save();

    response.status(200).json({ message: 'Connection request sent' });
  } catch (err) {
    response.status(500).json({ message: 'Server error', error: err });
  }
});

// accept or reject connection request
usersRouter.post('/connect/:userId/respond', authenticateToken, async (request, response) => {
  const { userId } = request.params; // user who sent the request
  const currentUserId = request.user._id; // current user who is responding
  const { action } = request.body; // accept or reject

  try {
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return response.status(404).json({ message: 'User not found' });
    }

    // find the connection request in the current user's connectionRequests array
    const connectionRequest = currentUser.connectionRequests.find(
      (request) => request.from.toString() === userId.toString()
    );

    if (!connectionRequest) {
      return response.status(404).json({ message: 'Connection request not found' });
    }

    if (action === 'accept') {
      connectionRequest.status = 'accepted';
      currentUser.connections.push(userId); // add user to connections
      const fromUser = await User.findById(userId);
      fromUser.connections.push(currentUserId); // add current user to the sender's connections
      await fromUser.save();
    } else if (action === 'reject') {
      connectionRequest.status = 'rejected';
    }

    await currentUser.save();
    response.status(200).json({ message: `Connection request ${action}ed` });
  } catch (err) {
    response.status(500).json({ message: 'Server error', error: err });
  }
});

// get current user's connections and pending requests
usersRouter.get('/connections', authenticateToken, async (request, response) => {
  const userId = request.user._id;
  try {
    const user = await User.findById(userId)
      .populate('connections', 'username name surname email') // populate connection data
      .populate('connectionRequests.from', 'username name surname email'); // populate request sender's data

    response.status(200).json({
      connections: user.connections,
      pendingRequests: user.connectionRequests.filter(request => request.status === 'pending')
    });
  } catch (err) {
    response.status(500).json({ message: 'Server error', error: err });
  }
});

// return connection status between user, (irrelevant, request or connected)
usersRouter.get('/connection-status/:targetUserId', authenticateToken, async (req, res) => {
  const currentUserId = req.user._id; // Current authenticated user
  const targetUserId = req.params.targetUserId; // User to check against

  try {
    // Fetch current user connections and connection requests
    const currentUser = await User.findById(currentUserId)
      .select('connections connectionRequests');

    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }

    // Fetch target user connection requests (we don't need connections here)
    const targetUser = await User.findById(targetUserId)
      .select('connectionRequests');

    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    // Check if current user is already connected to target user
    const isConnected = currentUser.connections.includes(targetUserId);

    // Check if there is a pending connection request from current user to target user
    const requestFromCurrentUser = targetUser.connectionRequests.find(request => 
      request.from.toString() === currentUserId
    );

    // Check if there is a pending connection request from target user to current user
    const requestFromTargetUser = currentUser.connectionRequests.find(request => 
      request.from.toString() === targetUserId
    );

    // Determine the connection status string
    let connectionStatus = 'irrelevant'; // Default status

    if (isConnected) {
      connectionStatus = 'connected';
    } else if (requestFromCurrentUser) {
      connectionStatus = 'request_sent'; // Current user sent a request to target user
    } else if (requestFromTargetUser) {
      connectionStatus = 'request_received'; // Target user sent a request to current user
    }

    // Return just the status string
    return res.status(200).json({ status: connectionStatus });

  } catch (error) {
    console.error('Error fetching connection status:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
});






// #### user profile attributes endpoints ###

// add skills
usersRouter.post('/skills', authenticateToken, async (request, response) => {
  const { skill } = request.body;
  const userId = request.user._id;

  if (skill.length > 200) {
    return response.status(400).json({ message: 'Skill length exceeds 200 characters.' });
  }

  try {
    const user = await User.findById(userId);
    user.skills.push({text: skill, public: true});
    await user.save();

    response.status(200).json(user.skills);
  } catch (err) {
    response.status(500).json({ message: 'Server error', error: err });
  }
});

// delete Skill
usersRouter.delete('/skills/:skillIndex', authenticateToken, async (request, response) => {
  const { skillIndex } = request.params;
  const userId = request.user._id;

  try {
    const user = await User.findById(userId);
    if (user.skills[skillIndex]) {
      user.skills.splice(skillIndex, 1); // Remove skill at the given index
      await user.save();
      response.status(200).json(user.skills);
    } else {
      response.status(404).json({ message: 'Skill not found' });
    }
  } 
  catch (err) {
    response.status(500).json({ message: 'Server error', error: err });
  }
});

// toggle public skill
usersRouter.put('/skills/:skillIndex', authenticateToken, async (request, response) => {
  const { skillIndex } = request.params;
  const userId = request.user._id;

  try {
    const user = await User.findById(userId);
    if (user.skills[skillIndex]) {
      user.skills[skillIndex].public ^= 1;
      await user.save();
      response.status(200).json(user.skills);
    } else {
      response.status(404).json({ message: 'Skill not found' });
    }
  } 
  catch (err) {
    response.status(500).json({ message: 'Server error', error: err });
  }
});

// add work experience
usersRouter.post('/work-experience', authenticateToken, async (request, response) => {
  const { experience } = request.body;
  const userId = request.user._id;

  if (experience.length > 200) {
    return response.status(400).json({ message: 'Work experience length exceeds 200 characters.' });
  }

  try {
    const user = await User.findById(userId);
    user.workExperience.push({text: experience, public: true});
    await user.save();

    response.status(200).json(user.workExperience);
  } 
  catch (err) {
    response.status(500).json({ message: 'Server error', error: err });
  }
});

// delete work experience
usersRouter.delete('/work-experience/:experienceIndex', authenticateToken, async (request, response) => {
  const { experienceIndex } = request.params;
  const userId = request.user._id;

  try {
    const user = await User.findById(userId);
    if (user.workExperience[experienceIndex]) {
      user.workExperience.splice(experienceIndex, 1);
      await user.save();
      response.status(200).json(user.workExperience);
    } else {
      response.status(404).json({ message: 'Work experience not found' });
    }
  } 
  catch (err) {
    response.status(500).json({ message: 'Server error', error: err });
  }
});

// toggle public work experience
usersRouter.put('/work-experience/:experienceIndex', authenticateToken, async (request, response) => {
  const { experienceIndex } = request.params;
  const userId = request.user._id;

  try {
    const user = await User.findById(userId);
    if (user.workExperience[experienceIndex]) {
      user.workExperience[experienceIndex].public ^= 1;
      await user.save();
      response.status(200).json(user.workExperience);
    } else {
      response.status(404).json({ message: 'Work experience not found' });
    }
  } 
  catch (err) {
    response.status(500).json({ message: 'Server error', error: err });
  }
});


// add education
usersRouter.post('/education', authenticateToken, async (request, response) => {
  const { education } = request.body;
  const userId = request.user._id;

  if (education.length > 200) {
    return response.status(400).json({ message: 'Education length exceeds 200 characters.' });
  }

  try {
    const user = await User.findById(userId);
    user.education.push({text: education, public: true});
    await user.save();

    response.status(200).json(user.education);
  } 
  catch (err) {
    response.status(500).json({ message: 'Server error', error: err });
  }
});

// delete education
usersRouter.delete('/education/:educationIndex', authenticateToken, async (request, response) => {
  const { educationIndex } = request.params;
  const userId = request.user._id;

  try {
    const user = await User.findById(userId);
    if (user.education[educationIndex]) {
      user.education.splice(educationIndex, 1);
      await user.save();
      response.status(200).json(user.education);
    } else {
      response.status(404).json({ message: 'Education not found' });
    }
  } catch (err) {
    response.status(500).json({ message: 'Server error', error: err });
  }
});

// toggle public education
usersRouter.put('/education/:educationIndex', authenticateToken, async (request, response) => {
  const { educationIndex } = request.params;
  const userId = request.user._id;

  try {
    const user = await User.findById(userId);
    if (user.education[educationIndex]) {
      user.education[educationIndex].public ^= 1;
      await user.save();
      response.status(200).json(user.education);
    } else {
      response.status(404).json({ message: 'Education not found' });
    }
  } catch (err) {
    response.status(500).json({ message: 'Server error', error: err });
  }
});

// edit description
usersRouter.put('/description', authenticateToken, async (request, response) => {
  const { description } = request.body;
  const userId = request.user._id;

  if (description.length > 1000) {
    return response.status(400).json({ message: 'Description length exceeds 200 characters.' });
  }
  try {
    const user = await User.findById(userId);
    user.description = description
    await user.save();

    response.status(200).json(user.description);
  } 
  catch (err) {
    response.status(500).json({ message: 'Server error', error: err });
  }
});

// edit employment status
usersRouter.put('/employment-status', authenticateToken, async (request, response) => {
  const { employmentStatus } = request.body;

  if (!employmentStatus || employmentStatus.trim() === '') {
    return response.status(400).json({ message: 'Employment status cannot be empty' });
  }

  try {
    const userId = request.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    user.employmentStatus = employmentStatus;
    await user.save();

    response.status(200).json({ message: 'Employment status updated successfully', employmentStatus: user.employmentStatus });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: 'Server error', error });
  }
});

// ##### settings #####

// change password
usersRouter.put('/change-password', authenticateToken, async (request, response) => {
  const { currentPassword, newPassword } = request.body;

  if (!currentPassword || !newPassword) {
    return response.status(400).json({ message: 'Current password and new password are required' });
  }

  try {
    const userId = request.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      return response.status(401).json({ message: 'Incorrect current password' });
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    user.passwordHash = hashedNewPassword;
    await user.save();

    response.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: 'Server error', error });
  }
});

// change email
usersRouter.put('/change-email', authenticateToken, async (req, res) => {
  const { newEmail } = req.body;

  if (!newEmail) {
    return res.status(400).json({ message: 'New email is required' });
  }

  try {
    const userId = req.user._id;

    // check if the new email is already in use
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already in use by another user' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.email = newEmail;
    await user.save();

    res.status(200).json({ message: 'Email changed successfully', newEmail: user.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// ##### search #####

// search users by name, username
usersRouter.get('/search', authenticateToken, async (request, response) => {
  try {
    const { query } = request.query; // `query` is the search term sent by the client

    if (!query) {
      return response.status(400).json({ message: 'Search query is required' });
    }

    const searchRegex = new RegExp(query, 'i');

    const users = await User.find({
      $or: [
        { name: { $regex: searchRegex } },
        { username: { $regex: searchRegex } },
      ]
    }).select("id");

    response.status(200).json(users);
  } catch (error) {
    console.error('Search error:', error);
    response.status(500).json({ message: 'Server error', error });
  }
});

// ##### notifications ####

//get notifications
usersRouter.get('/notifications', authenticateToken, async (request, response) => {
  const userId = request.user._id;

  try {
    const user = await User.findById(userId).select('notifications');

    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    response.status(200).json(user.notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    response.status(500).json({ message: 'Server error', error });
  }
});

module.exports = usersRouter