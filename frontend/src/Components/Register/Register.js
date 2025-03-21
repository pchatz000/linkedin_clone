import React, { useState } from 'react';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useNavigate } from 'react-router-dom'; // To redirect user after registration
import Navbar from '../Navbar/Navbar';
import { makeRequest } from '../../Services/apiUtility'; // Import makeRequest
import styles from './Register.module.css';

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordVerification, setShowPasswordVerification] = useState(false);
  
  const [username, setUsername] = useState('');  // Username
  const [name, setName] = useState('');  // First name
  const [surname, setSurname] = useState('');  // Last name
  const [email, setEmail] = useState('');  // Email
  const [password, setPassword] = useState('');  // Password
  const [confirmPassword, setConfirmPassword] = useState('');  // Confirm password
  const [phone, setPhone] = useState('');  // Phone number
  const [error, setError] = useState(null);  // Error message state
  
  const navigate = useNavigate();  // Navigate user on successful registration

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const togglePasswordVerificationVisibility = () => {
    setShowPasswordVerification(!showPasswordVerification);
  };

  const formatPhoneNumber = (phone) => {
    return '00' + phone;
  };  

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const formattedPhone = formatPhoneNumber(phone); // Format phone number

    const registerData = {
      username,
      name,
      surname,
      email,
      password,
      telephone: formattedPhone  
    };

    try {
      const response = await makeRequest({
        url: 'https://localhost:3000/api/users/register',
        method: 'POST',
        data: registerData,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 201) {
        const data = response.data;
        console.log('Registration successful:', data);

        // Redirect to the login page 
        navigate('/welcome/login');
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setError('An error occurred. Please try again later.');
    }
  };

  return (
    <div>
      <Navbar />
      <div className={styles['register-page']}>
        <div className={styles['register-form']}>
          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles['register-text']}>Register</h2>
          </div>
          <form onSubmit={handleRegister}>
            <div>
              <h2>Personal Details</h2>
              <label className={styles.label}>
                Username: <sup>*</sup>
                <input 
                  type="text" 
                  placeholder="Username" 
                  className={styles.inputField}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </label>

              <label className={styles.label}>
                Name: <sup>*</sup>
                <input 
                  type="text" 
                  placeholder="Name" 
                  className={styles.inputField}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <label className={styles.label}>
                Last Name: <sup>*</sup>
                <input 
                  type="text" 
                  placeholder="Last Name"
                  className={styles.inputField}
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  required
                />
              </label>

              <label className={styles.label}>
                Phone Number: <sup>*</sup>
                <PhoneInput
                  country={'us'}
                  value={phone}
                  onChange={setPhone}
                  containerClass={styles["phone-input-container"]}
                  inputClass={styles.inputField}
                />
              </label>

              <label className={styles.label}>
                Email: <sup>*</sup>
                <input 
                  type="email" 
                  placeholder="Email"
                  className={styles.inputField}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className={styles.passwordContainer}>
              <h2>Password</h2>
              <label className={styles.label}>
                Password <sup>*</sup>
              </label>
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

              <label className={styles.label}>
                Confirm Password <sup>*</sup>
              </label>
              <input 
                type={showPasswordVerification ? 'text' : 'password'}
                placeholder="Confirm Password" 
                className={styles.inputField}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              /> 
              <div onClick={togglePasswordVerificationVisibility} className={styles.eyeIcon}>
                {showPasswordVerification ? <HiEye /> : <HiEyeOff />}
              </div>
            </div>
            
            {/* Error message */}
            {error && <div className={styles.error}>{error}</div>}

            <button
              type="submit"
              className={styles.registerButton}
            >
              Create a profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
