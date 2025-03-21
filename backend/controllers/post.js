const express = require('express');
const multer = require('multer');
const path = require('path');
const postRouter = require('express').Router();
const Post = require('../models/post');
const User = require('../models/user')
const middlewares = require('../utils/middleware.js');

const authenticateToken = middlewares.authenticateToken;


const storage = multer.diskStorage({
  destination: (request, file, cb) => {
    cb(null, 'uploads/post-media'); // store in 'uploads/post-media' folder
  },
  filename: (request, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // unique filename with timestamp
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // limit file size to 10MB
  fileFilter: (request, file, cb) => {
    const fileTypes = /jpeg|jpg|png|mp4|avi/; // allow images and videos
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed!'));
    }
  }
});

// serve static files from the uploads directory
postRouter.use('/uploads/post-media', express.static('uploads/post-media'));

postRouter.post('/create', authenticateToken, upload.single('media'), async (request, response) => {
	const { text } = request.body;
	const authorID = request.user._id;
  
	try {
	  let mediaURL = null;
	  if (request.file) { // if media is uploaded
		mediaURL = `/uploads/post-media/${request.file.filename}`;
	  }
  
	  const post = new Post({
		text,
		authorID,
		mediaURL
	  });
  
	  const savedPost = await post.save();
  
	  const user = await User.findById(authorID);
  
	  if (!user) {
		return response.status(404).json({ message: 'User not found' });
	  }
  
	  user.posts = user.posts || [];
	  user.posts.push(savedPost._id);
  
	  await user.save();
  
	  response.status(201).json(savedPost);
	} catch (error) {
	  console.error(error);
	  response.status(500).json({ message: 'Server error', error });
	}
  });
  

postRouter.delete('/delete-post/:postId', authenticateToken, async (request, response) => {
	const { postId } = request.params;
	const userId = request.user._id;

	try {
		const post = await Post.findById(postId);
		if (!post) {
			return response.status(404).json({ message: 'Post not found' });
		}

		if (post.authorID.toString() !== userId.toString()) {
			return response.status(403).json({ message: 'Not authorized to delete this post' });
		}

		await Post.findByIdAndRemove(postId);

		const user = await User.findById(userId);
		if (user) {
			user.posts = user.posts.filter((post) => post.toString() !== postId.toString());
			await user.save();
		}

		response.status(200).json({ message: 'Post deleted successfully' });
	} catch (error) {
		console.error(error);
		response.status(500).json({ message: 'Server error', error });
	}
});

postRouter.get('/info/:postId', async (request, response) => {
	const { postId } = request.params;
	
	try {
		const post = await Post.findById(postId).populate('authorID', 'username name surname').populate('comments.commenterID', 'username name surname');
		if (!post) {
			return response.status(404).json({ message: 'Post not found' });
		}
		response.status(200).json(post);
	} catch (error) {
		console.error(error);
		response.status(500).json({ message: 'Server error', error });
	}
});

postRouter.post('/comment/:postId', authenticateToken, async (request, response) => {
	const { postId } = request.params;
	const { text } = request.body;
	const commenterID = request.user._id;
  
	try {
	  // Find the post by ID
	  const post = await Post.findById(postId);
	  if (!post) {
		return response.status(404).json({ message: 'Post not found' });
	  }
  
	  // Add the comment to the post's comments array
	  const comment = {
		text,
		commenterID,
		createdAt: new Date()
	  };
	  post.comments.push(comment);
	  await post.save();  // Save post with the new comment
  
	  // Find the post owner (user who created the post)
	  const postOwner = await User.findById(post.authorID);
	  if (!postOwner) {
		return response.status(404).json({ message: 'Post owner not found' });
	  }
  
	  // Add a notification for the post owner
	  postOwner.notifications.push({
		action: 'commented',
		from: commenterID,
		date: new Date()
	  });
	  await postOwner.save();  // Save post owner with new notification
  
	  response.status(201).json(post);
	} catch (error) {
	  console.error('Error in commenting on post or adding notification:', error);
	  response.status(500).json({ message: 'Server error', error });
	}
  });
  

postRouter.delete('/comment/:postId/:commentId', authenticateToken, async (request, response) => {
	const { postId, commentId } = request.params;
	const commenterId = request.user._id;
	
	try {
	  const post = await Post.findById(postId);
	  if (!post) {
		return response.status(404).json({ message: 'Post not found' });
	  }
	  
	  const comment = post.comments.id(commentId);
	  if (!comment) {
		return response.status(404).json({ message: 'Comment not found' });
	  }
	  
	  if (comment.commenterID.toString() !== commenterId.toString() && post.authorID.toString() !== commenterId.toString()) {
		return response.status(403).json({ message: 'Not authorized to delete this comment' });
	  }
  
	  post.comments.pull(commentId);
	  
	  await post.save();
	  
	  response.status(200).json({ message: 'Comment deleted successfully' });
	} 
	catch (error) {
	  console.error('Error while deleting comment:', error.message);
	  response.status(500).json({ message: 'Server error', error });
	}
});
  
postRouter.post('/like/:postId', authenticateToken, async (request, response) => {
	const { postId } = request.params;
	const userId = request.user._id;
  
	try {
	  const post = await Post.findById(postId);
	  if (!post) {
		return response.status(404).json({ message: 'Post not found' });
	  }
  
	  const user = await User.findById(userId);
	  if (!user) {
		return response.status(404).json({ message: 'User not found' });
	  }
  
	  // Check if user already liked the post
	  if (post.likes.includes(userId)) {
		return response.status(400).json({ message: 'You have already liked this post' });
	  }
  
	  // Add like to post
	  post.likes.push(userId);
	  await post.save();  // Save post with new like
  
	  // Add post to user's likedPosts array
	  user.likedPosts.push(postId);
	  await user.save();  // Save user with updated likedPosts
  
	  // Find the post's owner
	  const postOwner = await User.findById(post.authorID);
	  if (!postOwner) {
		return response.status(404).json({ message: 'Post owner not found' });
	  }
  
	  // Add a notification to post owner
	  postOwner.notifications.push({
		action: 'liked',
		from: userId,
		date: new Date()
	  });
	  await postOwner.save();  // Save post owner with new notification
  
	  response.status(200).json({ message: 'Post liked successfully', post });
	} catch (error) {
	  console.error('Error in liking post or adding notification:', error);
	  response.status(500).json({ message: 'Server error', error });
	}
  });
  
  
  
postRouter.post('/unlike/:postId', authenticateToken, async (request, response) => {
const { postId } = request.params;
const userId = request.user._id;

try {
	const post = await Post.findById(postId);
	const user = await User.findById(userId);

	if (!post || !user) {
	return response.status(404).json({ message: 'Post or user not found' });
	}

	if (!post.likes.includes(userId)) {
	return response.status(400).json({ message: 'You have not liked this post' });
	}

	post.likes = post.likes.filter(id => id.toString() !== userId.toString());
	await post.save();

	user.likedPosts = user.likedPosts.filter(id => id.toString() !== postId.toString());
	await user.save();

	response.status(200).json({ message: 'Post unliked successfully', post });
} catch (error) {
	console.error(error);
	response.status(500).json({ message: 'Server error', error });
}
});

postRouter.get('/feed', authenticateToken, async (request, response) => {
	try {
	  const userId = request.user._id;
  
	  const user = await User.findById(userId).populate('connections', 'id');
  
	  if (!user) {
		return response.status(404).json({ message: 'User not found' });
	  }
  
	  const userAndConnections = [userId, ...user.connections.map(conn => conn._id)];
  
	  const posts = await Post.find({ authorID: { $in: userAndConnections } })
		.sort({ createdAt: -1 })
		.select('_id');
  
	  const postIds = posts.map(post => post._id);
	  response.status(200).json({ feed: postIds });
  
	} catch (error) {
	  console.error('Error fetching feed:', error);
	  response.status(500).json({ message: 'Server error' });
	}
  });
  
  

module.exports = postRouter