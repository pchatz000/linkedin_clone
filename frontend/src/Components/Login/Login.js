import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import styles from './Login.module.css';
import { makeRequest } from '../../Services/apiUtility'; // Import the utility function

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Fetch user info after successful login
  const fetchUserInfo = async (userId, token) => {
    try {
      const userInfoResponse = await makeRequest({
        url: `https://localhost:3000/api/users/info/${userId}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      const user = userInfoResponse.data;
  
      // Check if the user is an admin
      if (user.isAdmin) {
        navigate('/administrator');  // Redirect to admin page
      } else {
        // Redirect to the profile page if not an admin
        navigate(`/profile/${userId}`, { state: { user } });
      }
    } catch (error) {
      console.error('Error fetching user info:', error.response ? error.response.data : error.message);
    }
  };  

  // Function to handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    const loginData = { username, password };

    try {
      // Send login request
      const response = await makeRequest({
        url: 'https://localhost:3000/api/auth/login/',
        method: 'POST',
        data: loginData,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Extract tokens and user ID from the response
      const { accessToken, refreshToken, id } = response.data;

      // Store tokens in localStorage for future authenticated requests
      localStorage.setItem('userId', id);  
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Fetch user info and redirect to profile 
      fetchUserInfo(id, accessToken);

    } catch (error) {
      setError(error.response ? error.response.data.message : 'Login failed');
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      <Navbar />
      <div className={styles['login-page']}>
        <div className={styles['login-form']}>
          <div className={styles.header}>
            <h2 className={styles['login-text']}>Login</h2>
          </div>
          <form onSubmit={handleLogin}>
              <div>
                  <input
                    type="text"
                    placeholder="Username"
                    className={styles.inputField} 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
              </div>
              <div className={styles.passwordContainer}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className={styles.inputField}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div onClick={togglePasswordVisibility} className={styles.eyeIcon}>
                  {showPassword ? <HiEye /> : <HiEyeOff />}
                </div>
              </div>
              
              {error && <div className={styles.error}>{error}</div>}
              
              <div className={styles.noAccount}>
                New to LinkedIn? 
                <Link to="/welcome/register" className={styles.joinNow}>Join Now.</Link>
              </div>

              <div>
                <button type="submit" className={styles.loginButton}>
                  Login <FontAwesomeIcon icon={faSignInAlt} className={styles['fa-sign-in-alt']}/>
                </button>
              </div>
            </form>
          </div>
        </div>
    </div>
  );
}

export default Login;
