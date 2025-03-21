import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRss, faBriefcase, faComments, faBell, faCircleUser, faCog, faUser, faUserFriends, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'; 
import { makeRequest } from '../../Services/apiUtility'; 
import styles from './Header.module.css';
import logo from '../../Images/logo.png';

const Header = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();  
    
    const [userName, setUserName] = useState('');
    const [userSurname, setSurname] = useState('');
    const [userId, setUserId] = useState('');
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        const accessToken = localStorage.getItem('accessToken');

        if (storedUserId && accessToken) {
            setUserId(storedUserId);
            const fetchUserInfo = async () => {
                try {
                    const response = await makeRequest({
                        url: `https://localhost:3000/api/users/info/${storedUserId}`,
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    });
                    setUserName(response.data.name);
                    setSurname(response.data.surname);
                } catch (error) {
                    console.error('Error fetching user info:', error);
                }
            };

            fetchUserInfo();
        }
    }, []);

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleLogout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                await makeRequest({
                    url: 'https://localhost:3000/api/auth/logout',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    data: { refreshToken }
                });
            } catch (error) {
                console.error('Error logging out:', error);
            }
        }
        localStorage.removeItem('userId');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/welcome/login');
    };

    const handleProfileNavigation = () => {
        if (userId) {
            navigate(`/profile/${userId}`);
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
    
        if (query.length >= 2) {
            setSearchLoading(true);
            setShowDropdown(true);
            try {
                const response = await makeRequest({
                    url: `https://localhost:3000/api/users/search?query=${query}`,
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                });
    
                const userIds = response.data;
    
                // Fetch user details based on IDs returned from the search
                const userDetailsPromises = userIds.map(async (user) => {
                    const userInfoResponse = await makeRequest({
                        url: `https://localhost:3000/api/users/info/${user._id}`, // Use _id to fetch details
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                        },
                    });
                    const to_return = { ...userInfoResponse.data, _id: user._id }
                    console.log(user);
                    console.log(to_return);
                    return to_return; // Return user info with _id
                });
    
                const userDetails = await Promise.all(userDetailsPromises);
                setSearchResults(userDetails); // Store the user details in search results
            } catch (error) {
                console.error('Error fetching search results:', error);
            } finally {
                setSearchLoading(false);
            }
        } else {
            setSearchResults([]);
            setShowDropdown(false);
        }
    };
    
    // Handle result click and navigate to the user's profile
    const handleResultClick = (userId) => {
        if (userId) {
            console.log("Navigating to profile with user ID:", userId);
            navigate(`/profile/${userId}`); // Navigate to the selected user's profile
            setShowDropdown(false);  // Close the dropdown after selection
        } else {
            console.error("User ID is undefined or invalid");
        }
    };    

    const closeDropdown = () => {
        setTimeout(() => {
            setShowDropdown(false);
        }, 200);  
    };

    return (
        <div className={styles.header}>
            <div className={styles.headerSection}>
                <Link to="/">
                    <img src={logo} alt="Logo" className={styles.headerLogo} />
                </Link>
                <div className={styles.headerItems}>
                    <div className={`${styles.headerItem} ${location.pathname === '/feed' && styles.active}`}>
                        <Link to="/feed" className={styles.link}>
                            <FontAwesomeIcon icon={faRss} className={styles.icon} />
                            <span>Feed</span>
                        </Link>
                    </div>
                    <div className={`${styles.headerItem} ${location.pathname === '/network' && styles.active}`}>
                        <Link to="/network" className={styles.link}>
                            <FontAwesomeIcon icon={faUserFriends} className={styles.icon} />
                            <span>Network</span>
                        </Link>
                    </div>
                    <div className={`${styles.headerItem} ${location.pathname === '/jobs' && styles.active}`}>
                        <Link to="/jobs" className={styles.link}>
                            <FontAwesomeIcon icon={faBriefcase} className={styles.icon} />
                            <span>Jobs</span>
                        </Link>
                    </div>
                    <div className={`${styles.headerItem} ${location.pathname === '/chat' && styles.active}`}>
                        <Link to="/chat" className={styles.link}>
                            <FontAwesomeIcon icon={faComments} className={styles.icon} />
                            <span>Chat</span>
                        </Link>
                    </div>
                    <div className={`${styles.headerItem} ${location.pathname === '/notifications' && styles.active}`}>
                        <Link to="/notifications" className={styles.link}>
                            <FontAwesomeIcon icon={faBell} className={styles.icon} />
                            <span>Notifications</span>
                        </Link>
                    </div>
                </div>
            </div>
            <div className={styles.headerSection}>
                <div className={styles.headerSearch}>
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchQuery} 
                        onChange={handleSearch}
                        onBlur={closeDropdown} 
                        onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)} 
                    />
                    {showDropdown && (
                        <div className={styles.searchResults}>
                            {searchResults.length > 0 ? (
                                searchResults.map((user, index) => (
                                    <div 
                                        key={user._id || index} 
                                        className={styles.searchResultItem} 
                                        onClick={() => {
                                            if (user._id) {
                                                console.log('User ID:', user._id);  
                                                handleResultClick(user._id);  
                                            } else {
                                                console.error("User _id is missing in search result:", user);
                                            }
                                        }} 
                                    >
                                        <div>
                                            <span className="userName">{user.name}</span>
                                            <br />
                                            <span className="userSurname">{user.surname}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>No users found.</p>
                            )}
                        </div>
                    )}
                    </div>

                <div className={styles.headerProfile} onClick={toggleDropdown}>
                    <FontAwesomeIcon icon={faCircleUser} className={styles.userIcon} />
                    <span>{userName ? `${userName} ${userSurname}` : 'Guest'}</span>
                    {dropdownOpen && (
                        <div className={styles.dropdownMenu}>
                            <div className={styles.dropdownItem} onClick={handleProfileNavigation}>
                                <FontAwesomeIcon icon={faUser} className={styles.dropdownIcon} />
                                <span>Profile</span>
                            </div>
                            <Link to="/settings" className={styles.dropdownItem}>
                                <FontAwesomeIcon icon={faCog} className={styles.dropdownIcon} />
                                <span>Settings</span>
                            </Link>
                            <div className={styles.dropdownItem} onClick={handleLogout}>
                                <FontAwesomeIcon icon={faSignOutAlt} className={styles.dropdownIcon} />
                                <span>Logout</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Header;
