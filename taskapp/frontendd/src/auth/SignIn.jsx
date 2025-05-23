import React, { useState } from 'react';
import { signIn } from '@aws-amplify/auth';

function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault(); // Prevent page refresh
    console.log('handleSignIn called with:', { username, password });

    if (!username || !password) {
      alert("Please enter both username and password");
      return;
    }

    try {
      const user = await signIn({ username, password });
      console.log('Signed in:', user);
      alert("Sign in successful!");
    } catch (error) {
      console.error('Error signing in:', error);
      alert("Sign in failed: " + error.message);
    }
  };

  return (
    <div>
      <h2>Sign In</h2>
      <form onSubmit={handleSignIn}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        /><br /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br /><br />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}

export default SignIn;
