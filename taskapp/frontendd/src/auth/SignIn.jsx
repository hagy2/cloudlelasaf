import React, { useState } from 'react';
import { signIn } from '@aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import PinkNavbar from '../components/navbar';
function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      setIsLoading(true);
      const user = await signIn({ username, password });
      console.log('Signed in:', user);
      navigate('/profile');
    } catch (error) {
      console.error('Error signing in:', error);
      setError("❌ Sign in failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = {
    maxWidth: '400px',
    margin: '60px auto',
    padding: '30px',
    borderRadius: '20px',
    background: 'linear-gradient(145deg, #ffe4ec, #ffd6e8)',
    boxShadow: '0 10px 25px rgba(255, 182, 193, 0.4)',
    textAlign: 'center',
    fontFamily: "'Comic Neue', cursive",
    color: '#b03060',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '12px 0',
    border: '1px solid #f8a5c2',
    borderRadius: '14px',
    fontSize: '16px',
    backgroundColor: '#fff0f5',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
    color: '#b03060',
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#ff69b4',
    color: 'white',
    border: 'none',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    marginTop: '20px',
  };

  const headingStyle = {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#d63384',
  };

  const errorStyle = {
    color: '#ff4d6d',
    marginTop: '10px',
    fontSize: '14px',
    backgroundColor: '#ffe3e3',
    borderRadius: '10px',
    padding: '8px',
  };

  return (
    <>
      <PinkNavbar />
    <div style={containerStyle}>
      <h2 style={headingStyle}>🎀 Welcome back 🎀</h2>
      {error && <div style={errorStyle}>{error}</div>}
      <form onSubmit={handleSignIn}>
        <input
          style={inputStyle}
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          style={inputStyle}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button style={buttonStyle} type="submit" disabled={isLoading}>
          {isLoading ? '🌸 Signing In...' : '💕 Sign In'}
        </button>
      </form>
    </div>
    </>
  );
}

export default SignIn;
