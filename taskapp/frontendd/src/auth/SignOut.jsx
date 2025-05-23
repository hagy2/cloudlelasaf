import React, { useState } from 'react';
import { signOut } from '@aws-amplify/auth';
import { useNavigate } from 'react-router-dom';

function Signout() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin'); // Redirect to signin page
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <h2>Sign Out</h2>
      <button onClick={handleSignOut}>Sign Out</button>
      {error && <p>{error}</p>}
    </div>
  );
}

export default Signout;
