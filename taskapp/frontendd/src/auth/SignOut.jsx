import React from 'react';
import { Auth } from 'aws-amplify';

function SignOut() {
  const handleSignOut = async () => {
    await Auth.signOut();
    alert('Signed out!');
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}

export default SignOut;
