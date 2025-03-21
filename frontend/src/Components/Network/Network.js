import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import styles from './Network.module.css';
import { makeRequest } from '../../Services/apiUtility';  // Import the makeRequest function
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

function Network() {
    const [connections, setConnections] = useState([]); // State to store connections with profile picture
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch the user's connections
                const response = await makeRequest({
                    url: 'https://localhost:3000/api/users/connections',
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const { connections } = response.data; // Get connections array

                // Fetch profile picture for each connection
                const connectionsWithPictures = await Promise.all(
                    connections.map(async (connection) => {
                        try {
                            // Fetch connection's profile details
                            const userInfoResponse = await makeRequest({
                                url: `https://localhost:3000/api/users/info/${connection._id}`,
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            });

                            // Add profile picture to the connection object
                            return {
                                ...connection,
                                profilePicture: userInfoResponse.data.profilePicture
                            };
                        } catch (error) {
                            console.error(`Error fetching profile picture for ${connection.username}:`, error);
                            return { ...connection, profilePicture: null }; // Return without profile picture on error
                        }
                    })
                );

                setConnections(connectionsWithPictures); // Update state with connections and their pictures
                setLoading(false);
            } catch (err) {
                console.error('Error fetching connections:', err);
                setError('Failed to load connections');
                setLoading(false);
            }
        };

        fetchConnections(); // Fetch connections on component mount
    }, []);

    return (
        <div>
            <Header />
            <div className={styles.networkPage}>
                <div className={styles.pageContent}>
                    <div className={styles.connectionsSummary}>
                        <div className={styles.summaryBox}>
                            <h2>Connections</h2>
                            <span>{connections.length}</span> {/* Show number of connections */}
                        </div>
                    </div>
                    <div className={styles.connectionGrid}>
                        {/* Loading and error states */}
                        {loading && <p>Loading connections...</p>}
                        {error && <p>{error}</p>}
                        
                        {/* Display fetched connections */}
                        {!loading && !error && connections.map((connection, index) => (
                            <div key={index} className={styles.connectionCard}>
                                <img 
                                    src={connection.profilePicture 
                                        ? `https://localhost:3000/api/users/uploads/profile-pictures/${connection.profilePicture.split('/').pop()}` // Correct URL for profile picture
                                        : 'https://via.placeholder.com/150'} 
                                    alt={connection.username} 
                                    className={styles.connectionImage} 
                                />
                                <div className={styles.connectionInfo}>
                                    <Link to={`/profile/${connection.id}`} className={styles.connectionLink}>
                                        <h3>{connection.name + ' ' + connection.surname}</h3>
                                        <p>{connection.email}</p>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Network;
