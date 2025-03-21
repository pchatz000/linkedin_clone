import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../../Images/logo.png';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/">
                    <img src={logo} alt="Logo" className="logo"/>
                </Link>
            </div>
            <div className="navbar-buttons">
                <Link to="/welcome/login">
                    <button className="login-button">Login</button>
                </Link>
                <Link to="/welcome/register">
                    <button className="register-button">Register</button>
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
