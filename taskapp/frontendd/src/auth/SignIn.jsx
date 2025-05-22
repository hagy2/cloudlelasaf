import React, { useState } from 'react';
import { signIn } from '@aws-amplify/auth';

function Signin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    try {
      const user = await signIn(username, password);
      console.log('Signed in user:', user);
      // Redirect to home or dashboard page here
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <h2>Sign In</h2>
      <input placeholder="Username" onChange={e => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleSignIn}>Sign In</button>
      {error && <p>{error}</p>}
    </div>
  );
}

export default Signin;
