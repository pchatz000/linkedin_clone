import React, { useState, useEffect } from 'react';
import styles from './Applicants.module.css';
import Header from '../Header/Header';
import { makeRequest } from '../../Services/apiUtility'; // Import the makeRequest function

function Applicants() {
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        setLoading(true);
        setError(null);

        const jobId = localStorage.getItem('jobId'); // Retrieve jobId from local storage
        if (!jobId) {
          throw new Error('No job ID provided');
        }

        // First, get the applicant user IDs for the job
        const response = await makeRequest({
          url: `https://localhost:3000/api/job/applicants/${jobId}`,
          method: 'GET',
        });

        const applicantIds = response.data; // Array of applicant user IDs

        // Fetch user details for each applicant ID
        const userDetailsPromises = applicantIds.map(async (userId) => {
          const userResponse = await makeRequest({
            url: `https://localhost:3000/api/users/info/${userId}`,
            method: 'GET',
          });
          return userResponse.data; 
        });

        // Wait for all user details to be fetched
        const userDetails = await Promise.all(userDetailsPromises);

        setUsers(userDetails); // Set the user details in state
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch applicants');
        setLoading(false);
      }
    };

    fetchApplicants();
  }, []);

  return (
    <div>
      <Header />
      <div className={styles.applicantsPage}>
        <div className={styles.pageContent}>
          <div className={styles.usersSummary}>
            <div className={styles.summaryBox}>
              <h2>Applicants</h2>
              <span>{users.length}</span>
            </div>
          </div>

          <div className={styles.usersGrid}>
            {loading && <p>Loading users...</p>} 
            {error && <p>{error}</p>} 
            {!loading && !error && users.length === 0 && <p>No applicants found.</p>} 

            {!loading && !error && users.map((user, index) => (
              <div key={index} className={styles.userCard}>
                <img 
                  src={user.profilePicture 
                    ? `https://localhost:3000/api/users/uploads/profile-pictures/${user.profilePicture.split('/').pop()}` // Correct URL for profile picture
                    : 'https://via.placeholder.com/150'} 
                  alt={user.name} 
                  className={styles.userImage} 
                />
                <div className={styles.userInfo}>
                  <h3>{user.name} {user.surname}</h3>
                  <p>Email: {user.email}</p>
                  <p>Telephone: {user.telephone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Applicants;
