import React, { useState } from 'react';
import { signOut } from '@aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import PinkNavbar from '../components/navbar';


function Signout() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (error) {
      setError(error.message);
    }
  };

  const containerStyle = {
    maxWidth: '400px',
    margin: '100px auto',
    padding: '40px',
    borderRadius: '25px',
    background: 'linear-gradient(135deg, #ffe4ec, #ffd6e8)',
    boxShadow: '0 12px 30px rgba(255, 182, 193, 0.4)',
    fontFamily: "'Comic Neue', cursive",
    textAlign: 'center',
    color: '#b03060',
  };

  const headingStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#d63384',
  };

  const buttonStyle = {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#ff69b4',
    color: '#fff',
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    boxShadow: '0 4px 12px rgba(255, 105, 180, 0.3)',
  };

  const errorStyle = {
    marginTop: '16px',
    padding: '10px',
    backgroundColor: '#ffe3e3',
    color: '#ff4d6d',
    borderRadius: '10px',
    fontSize: '14px',
  };

  return (
   <>
      <PinkNavbar />
    <div style={containerStyle}>
      
      <h2 style={headingStyle}>👋 Leaving So Soon?</h2>
      <p style={{ marginBottom: '20px' }}>We’ll miss you! Come back anytime 💖</p>
      <button style={buttonStyle} onClick={handleSignOut}>✨ Sign Out</button>
      {error && <div style={errorStyle}>{error}</div>}
    </div>
    </>
  );
}

export default Signout;
