import React, { useState, useEffect } from 'react';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Header from '../Header/Header';
import styles from './Settings.module.css';
import {makeRequest} from '../../Services/apiUtility';  // Import makeRequest utility

function Settings() {
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false); 
    const [showPasswordVerification, setShowPasswordVerification] = useState(false);
    
    const [userData, setUserData] = useState({
        name: '',
        surname: '',
        phone: '',
        email: ''
    });

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const userId = localStorage.getItem('userId');  // Retrieve userId from local storage

    useEffect(() => {
        // Fetch user data from backend
        const fetchUserData = async () => {
            try {
                const response = await makeRequest({
                    url: `https://localhost:3000/api/users/info/${userId}`,  // Make sure the URL is correctly prefixed with /api
                    method: 'GET'
                });

                setUserData({
                    name: response.data.name,
                    surname: response.data.surname,
                    phone: response.data.phone,
                    email: response.data.email
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, [userId]);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleNewPasswordVisibility = () => {
        setShowNewPassword(!showNewPassword);
    };

    const togglePasswordVerificationVisibility = () => {
        setShowPasswordVerification(!showPasswordVerification);
    };

    // Handler for changing password
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            alert('New password and confirmation do not match.');
            return;
        }

        try {
            await makeRequest({
                url: 'https://localhost:3000/api/users/change-password',  
                method: 'PUT',
                data: { currentPassword, newPassword }
            });
            
            alert('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Failed to change password.');
        }
    };

    // Handler for changing email
    const handleEmailChange = async (e) => {
        e.preventDefault();

        try {
            await makeRequest({
                url: 'https://localhost:3000/api/users/change-email',  
                method: 'PUT',
                data: { newEmail }
            });
            
            alert('Email changed successfully!');
            setNewEmail('');  // Clear the new email field after success
        } catch (error) {
            console.error('Error changing email:', error);
            alert('Failed to change email.');
        }
    };

    return (
        <div>
            <Header />
            <div className={styles.settingsPage}>
                <div className={styles.settingsDetails}>
                    <div>
                        <h2>Personal Details</h2>
                        <label className={styles.label}>
                            Name: 
                            <input 
                                type="text" 
                                name="firstname" 
                                value={userData.name}  
                                className={styles.inputField}
                                readOnly    
                            />
                        </label>

                        <label className={styles.label}>
                            Last Name: 
                            <input 
                                type="text" 
                                name="lastname" 
                                value={userData.surname}  
                                className={styles.inputField}
                                readOnly    
                            />
                        </label>

                        <label className={styles.label}>
                            Phone Number: 
                            <PhoneInput
                                country={'us'}
                                value={userData.phone}  
                                containerClass={styles["phone-input-container"]}
                                inputClass={styles.inputField}
                                readOnly    
                                disableDropdown  
                            />
                        </label>
                    </div>
                    <form onSubmit={handleEmailChange}>
                        <div>
                            <h2>Change Email</h2>
                            <label className={styles.label}>
                                Email: 
                                <input 
                                    type="text" 
                                    name="email" 
                                    value={userData.email}  
                                    className={styles.emailField}
                                    readOnly    
                                />
                            </label>

                            <label className={styles.label}>New Email</label>
                            <input 
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="New Email"
                                className={styles.newEmailField}
                            />
                            <button
                                type="submit"
                                className={styles.saveChanges}
                            >
                                Change Email
                            </button>
                        </div>
                    </form>
                    
                    <form onSubmit={handlePasswordChange} >
                        <div className={styles.passwordContainer}>
                            <h2>Change Password</h2>

                            <label className={styles.label}>Current Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Current Password"
                                className={styles.passwordField}
                            />
                            <div onClick={togglePasswordVisibility} className={styles.eyeIcon}>
                                {showPassword ? <HiEye /> : <HiEyeOff />}
                            </div>

                            <label className={styles.label}>New Password</label>
                            <input
                                type={showNewPassword ? 'text' : 'password'}  
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New Password"
                                className={styles.passwordField}
                            />
                            <div onClick={toggleNewPasswordVisibility} className={styles.eyeIcon}>
                                {showNewPassword ? <HiEye /> : <HiEyeOff />}
                            </div>

                            <label className={styles.label}>Confirm New Password</label>
                            <input 
                                type={showPasswordVerification ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm New Password" 
                                className={styles.passwordField}
                            /> 
                            <div onClick={togglePasswordVerificationVisibility} className={styles.eyeIcon}>
                                {showPasswordVerification ? <HiEye /> : <HiEyeOff />}
                            </div>

                            <button
                                type="submit"
                                className={styles.saveChanges}
                            >
                                Change Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>    
        </div>
    );
}

export default Settings;
