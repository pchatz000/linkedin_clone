import React, { useState, useEffect } from 'react';
import styles from './Administrator.module.css';
import Header from './Header';
import { makeRequest } from '../../Services/apiUtility'; // Import the makeRequest function
import { parse as js2xmlparse } from 'js2xmlparser'; // Named import for the 'parse' function

function Administrator() {
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [selectedUsers, setSelectedUsers] = useState([]); // To store selected users

  // Fetch users from the API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setError(null); 
        const response = await makeRequest({
          url: 'https://localhost:3000/api/users',
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`, 
          },
        });

        setUsers(response.data); 
      } catch (err) {
        setError('Failed to load users');
        console.error('Error:', err);
      } finally {
        setLoading(false); 
      }
    };

    fetchUsers(); 
  }, []);

  // Handle user selection
  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId)); // Deselect user
    } else {
      setSelectedUsers([...selectedUsers, userId]); // Select user
    }
  };

  // Export selected users to JSON
  const exportToJSON = () => {
    const selectedData = users.filter(user => selectedUsers.includes(user._id));
    const jsonData = JSON.stringify(selectedData, null, 2); // Pretty print JSON
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'users.json');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  // Export selected users to XML
  const exportToXML = () => {
    const selectedData = users.filter(user => selectedUsers.includes(user._id));
    const xmlData = js2xmlparse("users", { user: selectedData });
    const blob = new Blob([xmlData], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'users.xml');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  return (
    <div>
      <Header />
      <div className={styles.administratorPage}>
        <div className={styles.pageContent}>
          <div className={styles.usersSummary}>
            <div className={styles.summaryBox}>
              <h2>Users</h2>
              <span>{users.length}</span>
              <div className={styles.exportButtons}>
                <button onClick={exportToJSON} disabled={selectedUsers.length === 0}>
                  Export as JSON
                </button>
                <button onClick={exportToXML} disabled={selectedUsers.length === 0}>
                  Export as XML
                </button>
              </div>
            </div>
          </div>

          <div className={styles.usersGrid}>
            {loading && <p>Loading users...</p>} 
            {error && <p>{error}</p>} 
            {!loading && !error && users.length === 0 && <p>No users found.</p>} 

            {/* Display each user */}
            {!loading && !error && users.length > 0 && users.map((user, index) => (
              <div key={index} className={styles.userCard}>
                {/* Handle profile picture */}
                <input 
                  type="checkbox" 
                  onChange={() => handleSelectUser(user._id)}
                  checked={selectedUsers.includes(user._id)}
                />
                <img 
                  src={user.profilePicture 
                    ? `https://localhost:3000/api/users/uploads/profile-pictures/${user.profilePicture.split('/').pop()}` 
                    : 'https://via.placeholder.com/150'} 
                  alt={`${user.name || 'Unknown'}'s profile`} 
                  className={styles.userImage} 
                />
                <div className={styles.userInfo}>
                  <h3>{user.name || 'Unknown'} {user.surname || ''}</h3>
                  <p>{user.email || 'No email provided'}</p>
                  <p>{user.telephone || 'No telephone available'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Administrator;
