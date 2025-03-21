import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import './Welcome.css';

function Welcome() {
  return (
    <div>
      <Navbar />
      <div className="welcome-page">
        <div className="welcome-box">
          <h2>Welcome to Our Website!</h2>
          <div className="welcome-buttons">
              <Link to="/welcome/login">
                  <button className="login-button">Login</button>
              </Link>
              <Link to="/welcome/register">
                  <button className="register-button">Register</button>
              </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
