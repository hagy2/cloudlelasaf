import React, { useState } from 'react';
import { signUp, confirmSignUp } from '@aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import PinkNavbar from '../components/navbar';
function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    try {
      await signUp({
        username,
        password,
        options: {
          userAttributes: { email },
        },
      });
      setShowConfirmation(true);
      setError('');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleConfirmSignUp = async () => {
    try {
      await confirmSignUp({ username, confirmationCode });
      alert('🎉 Sign up successful! Please sign in.');
      navigate('/signin');
    } catch (error) {
      setError(error.message);
    }
  };

  const containerStyle = {
    maxWidth: '400px',
    margin: '60px auto',
    padding: '30px',
    borderRadius: '16px',
    background: 'linear-gradient(145deg, #f9f9f9, #ffffff)',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.05)',
    textAlign: 'center',
    fontFamily: '"Comic Neue", cursive',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    margin: '10px 0',
    border: '1px solid #ddd',
    borderRadius: '12px',
    fontSize: '16px',
    backgroundColor: '#fffefc',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#ffb6b9',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s',
    marginTop: '15px',
  };

  const headingStyle = {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#ff6f91',
  };

  const errorStyle = {
    color: '#ff6f61',
    marginTop: '10px',
    fontSize: '14px',
  };

  return (
    <>
      <PinkNavbar />
    <div style={containerStyle}>
      {!showConfirmation ? (
        <>
          <h2 style={headingStyle}>🌸 Sign Up</h2>
          <input
            style={inputStyle}
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <input
            style={inputStyle}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button style={buttonStyle} onClick={handleSignUp}>Sign Up</button>
          {error && <p style={errorStyle}>❌ {error}</p>}
        </>
      ) : (
        <>
          <h2 style={headingStyle}>📬 Confirm Your Code</h2>
          <input
            style={inputStyle}
            placeholder="Confirmation Code"
            value={confirmationCode}
            onChange={e => setConfirmationCode(e.target.value)}
          />
          <button style={buttonStyle} onClick={handleConfirmSignUp}>Confirm</button>
          {error && <p style={errorStyle}>⚠️ {error}</p>}
        </>
      )}
    </div>
    </>
  );
}

export default Signup;
