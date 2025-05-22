import React, { useState } from 'react';
import { signUp, confirmSignUp } from '@aws-amplify/auth';
import { useNavigate } from 'react-router-dom';

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
    } catch (error) {
      setError(error.message);
    }
  };

  const handleConfirmSignUp = async () => {
    try {
      await confirmSignUp({ username, confirmationCode });
      alert('Sign up successful! Please sign in.');
      navigate('/signin');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      {!showConfirmation ? (
        <>
          <h2>Sign Up</h2>
          <input placeholder="Username" onChange={e => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
          <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
          <button onClick={handleSignUp}>Sign Up</button>
          {error && <p>{error}</p>}
        </>
      ) : (
        <>
          <h2>Confirm Sign Up</h2>
          <input placeholder="Confirmation Code" onChange={e => setConfirmationCode(e.target.value)} />
          <button onClick={handleConfirmSignUp}>Confirm</button>
          {error && <p>{error}</p>}
        </>
      )}
    </div>
  );
}

export default Signup;
