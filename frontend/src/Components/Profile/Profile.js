import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import styles from './Profile.module.css';
import { Link, useParams } from 'react-router-dom';
import { makeRequest } from '../../Services/apiUtility'; 

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(false);
  const { userId } = useParams();
  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch profile data of the user whose profile is being viewed
        const response = await makeRequest({
          method: 'GET',
          url: `https://localhost:3000/api/users/info/${userId}`,
        });

        setUserData(response.data);

        if (userId !== currentUserId) {
          // Fetch connection status between current user and the profile user
          const connectionStatusResponse = await makeRequest({
            method: 'GET',
            url: `https://localhost:3000/api/users/connection-status/${userId}`,
          });
          
          console.log(connectionStatusResponse.data.status); // Debugging purpose

          // Update the state based on the response status
          switch (connectionStatusResponse.data.status) {
            case 'connected':
              setIsConnected(true);
              break;
            case 'request_sent':
              setPendingRequest(true);
              break;
            case 'request_received':
              setIncomingRequest(true);
              break;
            default:
              // No action needed for "irrelevant" or unrecognized status
              break;
          }
          console.log(isConnected, pendingRequest, incomingRequest)
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, currentUserId]);

  const handleConnect = async () => {
    try {
      await makeRequest({
        method: 'POST',
        url: `https://localhost:3000/api/users/connect/${userId}`,
      });
      setPendingRequest(true);
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const handleChat = () => {
    window.location.href = `/chat`;
  };

  const handleAcceptRequest = async () => {
    try {
      await makeRequest({
        method: 'POST',
        url: `https://localhost:3000/api/users/connect/${userId}/respond`,
        data: { action: 'accept' },
      });
      setIsConnected(true);
      setIncomingRequest(false);
    } catch (error) {
      console.error('Error accepting connection request:', error);
    }
  };

  const handleRejectRequest = async () => {
    try {
      await makeRequest({
        method: 'POST',
        url: `https://localhost:3000/api/users/connect/${userId}/respond`,
        data: { action: 'reject' },
      });
      setIncomingRequest(false);
    } catch (error) {
      console.error('Error rejecting connection request:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userData) {
    return <div>Error loading user data.</div>;
  }

  const profilePictureUrl = userData.profilePicture
    ? `https://localhost:3000/api/users/uploads/profile-pictures/${userData.profilePicture.split('/').pop()}`
    : 'https://via.placeholder.com/150'; 

  return (
    <div className={styles['profile-page']}>
      <Header />
      <div className={styles['profile-content']}>
        {/* Profile Header Section */}
        <div className={styles['profile-header']}>
          <div className={styles['profile-info']}>
            <img
              src={profilePictureUrl}
              alt="Profile"
              className={styles['profile-pic']}
            />
            <div className={styles['profile-details']}>
              <h2 className={styles['profile-name']}>{userData.name} {userData.surname}</h2>
              <p className={styles['profile-description']}>
                {userData.description || 'No description available'}
              </p>

              {currentUserId === userId ? (
                <Link to={`/edit-profile/${userId}`}>
                  <button className={styles['edit-button']}>Edit Profile</button>
                </Link>
              ) : (
                <div>
                  {isConnected ? (
                    <button className={styles['chat-button']} onClick={handleChat}>Start Chat</button>
                  ) : pendingRequest ? (
                    <button className={styles['pending-button']} disabled>Request Pending</button>
                  ) : incomingRequest ? ( // Show Accept/Reject buttons if there's an incoming request
                    <div>
                      <button className={styles['accept-button']} onClick={handleAcceptRequest}>Accept</button>
                      <button className={styles['reject-button']} onClick={handleRejectRequest}>Reject</button>
                    </div>
                  ) : (
                    <button className={styles['connect-button']} onClick={handleConnect}>Connect</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details Section */}
        <div className={styles['profile-details-section']}>
          <div className={styles['skills-container']}>
            <h3>Skills</h3>
            <ul>
              {userData.skills && userData.skills.length > 0 ? (
                userData.skills.map((skill) => (
                  <li key={skill._id}>
                    {skill.text}
                  </li>
                ))
              ) : (
                <p>No skills available.</p>
              )}
            </ul>
          </div>
          
          <div className={styles['experience-container']}>
            <h3>Experience</h3>
            <ul>
              {userData.workExperience && userData.workExperience.length > 0 ? (
                userData.workExperience.map((exp, index) => (
                  <li key={index}>
                    {exp.text}
                  </li>
                ))
              ) : (
                <p>No experience available.</p>
              )}
            </ul>
          </div>
          
          <div className={styles['education-container']}>
            <h3>Education</h3>
            <ul>
              {userData.education && userData.education.length > 0 ? (
                userData.education.map((edu, index) => (
                  <li key={index}>
                    {edu.text} 
                  </li>
                ))
              ) : (
                <p>No education available.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
