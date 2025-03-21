import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';  // Import Link for navigation
import styles from './Notifications.module.css';
import { makeRequest } from '../../Services/apiUtility'; 

function Notifications() {
  const [notifications, setNotifications] = useState([]); // State to store notifications
  const [loading, setLoading] = useState(true); // State to track loading status
  const [userDetails, setUserDetails] = useState({}); // State to store user details

  // Fetch notifications when the component mounts
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Fetch notifications from the backend
        const response = await makeRequest({
          method: 'GET',
          url: `https://localhost:3000/api/users/notifications`, // Fetch user notifications
        });
        setNotifications(response.data); // Store notifications in state

        // For each notification, fetch the user details
        const userPromises = response.data.map(async (notif) => {
          if (!userDetails[notif.from]) {
            const userResponse = await makeRequest({
              method: 'GET',
              url: `https://localhost:3000/api/users/info/${notif.from}`, // Fetch the user details
            });
            return { id: notif.from, data: userResponse.data };
          }
          return null; // Skip if user details already exist
        });

        const usersData = await Promise.all(userPromises);

        // Update userDetails state with the new users data
        const userDetailsMap = usersData.reduce((acc, user) => {
          if (user) {
            acc[user.id] = user.data;
          }
          return acc;
        }, {});

        setUserDetails((prevDetails) => ({ ...prevDetails, ...userDetailsMap }));
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchNotifications();
  }, [userDetails]);

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while fetching
  }

  // Filter connection requests (action: 'connectionRequest')
  const connectionRequests = notifications.filter(notif => notif.action === 'connectionRequest');
  
  // Filter other notifications (actions: 'commented', 'liked', etc.)
  const otherNotifications = notifications.filter(notif => notif.action !== 'connectionRequest');
  console.log(notifications)
  return (
    <div className={styles.notificationPage}>
      <Header />
      <div className={styles.notifications}>
        
        {/* Connection Requests Section */}
        <div className={styles.requestsContainer}>
          <h3>Connection Requests</h3>
          <ul className={styles.requestsList}>
            {connectionRequests.length > 0 ? (
              connectionRequests.map((notif, index) => {
                const user = userDetails[notif.from];
                return (
                  <li key={index} className={styles.requestItem}>
                    <span>
                      {user ? (
                        <Link to={`/profile/${notif.from}`}>
                          {user.name} {user.surname} {/* Display full name */}
                        </Link>
                      ) : (
                        'Loading user...'
                      )}
                      {' '}requested to connect
                    </span>
                  </li>
                );
              })
            ) : (
              <li>No connection requests.</li>
            )}
          </ul>
        </div>

        {/* Other Notifications (e.g., Likes, Comments) */}
        <div className={styles.postsContainer}>
          <h3>Notifications from your Posts</h3>
          <ul className={styles.postsList}>
            {otherNotifications.length > 0 ? (
              otherNotifications.map((notif, index) => {
                const user = userDetails[notif.from];
                return (
                  <li key={index} className={styles.postNotification}>
                    <span>
                      {user ? (
                        <Link to={`/profile/${notif.from}`}>
                          {user.name} {user.surname}
                        </Link>
                      ) : (
                        'Loading user...'
                      )}
                      {notif.action === 'commented' && ' commented on your post'}
                      {notif.action === 'liked' && ' liked your post'}
                    </span>
                  </li>
                );
              })
            ) : (
              <li>No new notifications from your posts.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Notifications;
