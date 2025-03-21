import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import styles from './Feed.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import { makeRequest } from '../../Services/apiUtility'; // Import the makeRequest function

function Feed() {
    const [posts, setPosts] = useState([]); 
    const [newPostText, setNewPostText] = useState('');
    const [userData, setUserData] = useState({ name: '', description: '', profilePicture: '' });
    const userId = localStorage.getItem('userId'); 
    const [selectedMedia, setSelectedMedia] = useState(null); 
    const [commentText, setCommentText] = useState({}); // Object to store comments for each post

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await makeRequest({
                    url: `https://localhost:3000/api/users/info/${userId}`,
                    method: 'GET'
                });

                setUserData({
                    name: response.data.name,
                    surname: response.data.surname,
                    description: response.data.description || 'No description available',
                    profilePicture: response.data.profilePicture || ''
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        const fetchFeed = async () => {
            try {
                const feedResponse = await makeRequest({
                    url: 'https://localhost:3000/api/post/feed',
                    method: 'GET'
                });
        
                const feedIds = feedResponse.data.feed; // The list of post IDs
        
                const fetchedPosts = await Promise.all(
                    feedIds.map(async (postId) => {
                        const postResponse = await makeRequest({
                            url: `https://localhost:3000/api/post/info/${postId}`,
                            method: 'GET'
                        });
                        const post = postResponse.data;
        
                        let authorId = post.authorID; 
                        if (typeof authorId === 'object') {
                            authorId = authorId._id || authorId.id;  
                        }
        
                        const authorResponse = await makeRequest({
                            url: `https://localhost:3000/api/users/info/${authorId}`,
                            method: 'GET'
                        });
                        
                        const authorDetails = authorResponse.data;
        
                        const isLikedByUser = post.likes.includes(userId);
        
                        return { ...post, authorDetails, isLikedByUser };
                    })
                );
        
                // Update the posts state with the fetched post details
                setPosts(fetchedPosts);
            } catch (error) {
                console.error('Error fetching posts:', error);
            }
        };               

        fetchUserData();
        fetchFeed();
    }, [userId]);

    // Handle likes/unlikes toggle
    const handleLikeToggle = async (index, postId, isLikedByUser) => {
        try {
            if (isLikedByUser) {
                // If the user has already liked the post, unlike it
                await makeRequest({
                    url: `https://localhost:3000/api/post/unlike/${postId}`,
                    method: 'POST'
                });
            } else {
                // If the user hasn't liked the post yet, like it
                await makeRequest({
                    url: `https://localhost:3000/api/post/like/${postId}`,
                    method: 'POST'
                });
            }

            // Update the local state
            const updatedPosts = [...posts];
            updatedPosts[index].isLikedByUser = !isLikedByUser; // Toggle like status
            updatedPosts[index].likes = isLikedByUser
                ? updatedPosts[index].likes.filter((id) => id !== userId) // Remove the like
                : [...updatedPosts[index].likes, userId]; // Add the like

            setPosts(updatedPosts);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    // Handle adding comments
    const handleCommentSubmit = async (postId, index) => {
    
        try {
            const commentPayload = { text: commentText[postId] };
            
            const response = await makeRequest({
                url: `https://localhost:3000/api/post/comment/${postId}`,
                method: 'POST',
                data: commentPayload,
            });
        
            // Accept both 200 OK and 201 Created as valid responses
            if (response && (response.status === 200 || response.status === 201)) {
                
                const updatedPosts = [...posts];
                updatedPosts[index].comments = response.data.comments; // Replace comments with updated array
                
                setPosts(updatedPosts);
    
                // Clear the comment input for this specific post
                setCommentText((prev) => ({
                    ...prev,
                    [postId]: '' // Clear only this post's comment
                }));
                window.location.reload()
            } else {
                console.error('Unexpected response status:', response.status);
            }
        } catch (error) {
            console.error('Error adding comment:', error.response || error.message || error);
        }
    };    
    
    // Handle post submission (text + media)
    const handlePostSubmit = async () => {
        if (newPostText.trim() || selectedMedia) {
            try {
                const formData = new FormData();
                formData.append('text', newPostText); 
                formData.append('authorID', userId);  
                
                if (selectedMedia) {
                    formData.append('media', selectedMedia); 
                }
    
                const response = await makeRequest({
                    url: 'https://localhost:3000/api/post/create',
                    method: 'POST',
                    data: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                });
        
                if (response.status === 201) {
                    const newPost = {
                        _id: response.data._id, 
                        authorID: userId,      
                        text: newPostText,
                        mediaURL: response.data.mediaURL || null,
                        likes: [],
                        comments: [],
                        isLikedByUser: false,
                        authorDetails: {
                            name: userData.name,
                            surname: userData.surname,
                            username: userData.name 
                        }
                    };
    
                    setPosts([newPost, ...posts]); 
                    setNewPostText(''); 
                    setSelectedMedia(null);
                } else {
                    alert('Failed to create post. Please try again.');
                }
            } catch (error) {
                console.error('Error creating new post:', error);
                alert('Error creating post.');
            }
        }
    };          
    
    const profilePictureUrl = userData.profilePicture
        ? `https://localhost:3000/api/users/uploads/profile-pictures/${userData.profilePicture.split('/').pop()}`
        : 'https://via.placeholder.com/150';

    return (
        <div className={styles.feedPage}>
            <Header />
            <div className={styles.container}>
                <div className={styles.leftColumn}>
                    <div className={styles.profileSection}>
                        <img src={profilePictureUrl} alt="Profile" className={styles.profileImage} />
                        <h2>{userData.name} {userData.surname}</h2> 
                        <p>{userData.description}</p> 
                    </div>
                </div>

                <div className={styles.middleColumn}>
                    <div className={styles.newPostSection}>
                        <h3>New Post</h3>
                        <textarea
                            placeholder="What's on your mind?"
                            value={newPostText}
                            onChange={(e) => setNewPostText(e.target.value)}
                            className={styles.newPostInput}
                        />
                        <input 
                            type="file" 
                            accept="image/*,video/*,audio/*" 
                            onChange={(e) => setSelectedMedia(e.target.files[0])} 
                            className={styles.fileInput} 
                        />
                        <div className={styles.postActionsContainer}>
                            <button onClick={handlePostSubmit} className={styles.postButton}>
                                Post
                            </button>
                        </div>
                    </div>

                    <div className={styles.postsFeed}>
                        {posts.map((post, index) => (
                            <div key={post._id} className={styles.post}>
                                <h4>{post.authorDetails?.name + ' ' + post.authorDetails?.surname || 'Unknown Author'}</h4>
                                <p className={styles.role}>{post.authorDetails?.username || 'Unknown Username'}</p>
                                <p>{post.text}</p>
                                {post.mediaURL && (
                                    <img 
                                        src={`https://localhost:3000/api/post/${post.mediaURL}`} 
                                        alt="Post media" 
                                        className={styles.postImage} 
                                    />
                                )}
                                <div className={styles.postActions}>
                                    <FontAwesomeIcon
                                        icon={faThumbsUp}
                                        onClick={() => handleLikeToggle(index, post._id, post.isLikedByUser)}
                                        className={styles.likeIcon}
                                        style={{ color: post.isLikedByUser ? 'blue' : 'grey' }} 
                                    />
                                    <span>{post.likes?.length || 0}</span>
                                </div>
                                {/* Comment Section */}
                                <div className={styles.commentSection}>
                                    <input 
                                        type="text" 
                                        placeholder="Add a comment"
                                        value={commentText[post._id] || ''} 
                                        onChange={(e) => setCommentText(prev => ({ ...prev, [post._id]: e.target.value }))}
                                        className={styles.commentInput}
                                    />
                                    <button 
                                        onClick={() => handleCommentSubmit(post._id, index)} 
                                        className={styles.commentButton}
                                    >
                                        Comment
                                    </button>
                                    <div className={styles.commentsList}>
                                        {post.comments.map((comment) => (
                                            <p key={comment._id}>
                                                <strong>{`${comment.commenterID.name} ${comment.commenterID.surname}`}</strong>: {comment.text}
                                            </p>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Feed;
