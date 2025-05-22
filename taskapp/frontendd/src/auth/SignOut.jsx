import React from 'react';
import { signOut } from '@aws-amplify/auth';

function Signout() {
  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to login page or home
      window.location.href = '/signin';
    } catch (error) {
      console.log('Error signing out:', error);
    }
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}

export default Signout;
