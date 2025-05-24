import React, { useState } from 'react';
import { signIn } from '@aws-amplify/auth';
import { useNavigate } from 'react-router-dom';

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
      setError("Please enter both username and password");
      return;
    }

    try {
      setIsLoading(true);
      const user = await signIn({ username, password });
      console.log('Signed in:', user);

      // Redirect to profile page after successful sign-in
      navigate('/profile');
      
    } catch (error) {
      console.error('Error signing in:', error);
      setError("Sign in failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4 mt-10 bg-white shadow-md rounded">
      <h2 className="text-xl font-bold mb-4">Sign In</h2>
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSignIn}>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded text-white ${isLoading ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default SignIn;