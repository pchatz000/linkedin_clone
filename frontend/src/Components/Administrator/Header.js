import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';
import logo from '../../Images/logo.png';

const Header = () => {
    return (
        <nav className="navbar">
            <div className={styles.navbarLogo}>
                <Link to="/">
                    <img src={logo} alt="Logo" className={styles.logo}/>
                </Link>
            </div>
        </nav>
    );
};

export default Header;
