import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './PinkNavbar.css';

const PinkNavbar = () => {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/profile', label: 'Profile' },
    { path: '/tasks', label: 'Tasks' },
    { path: '/signin', label: 'Sign In' },
    { path: '/signup', label: 'Sign Up' },
    { path: '/signout', label: 'Sign Out' },
  ];

  return (
    <nav className="pink-navbar">
      <div className="navbar-container">
        <div className="navbar-logo">💖 MyApp</div>
        <ul className="navbar-links">
          {navLinks.map(({ path, label }) => (
            <li key={path}>
              <Link
                to={path}
                className={`nav-button ${location.pathname === path ? 'active' : ''}`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default PinkNavbar;