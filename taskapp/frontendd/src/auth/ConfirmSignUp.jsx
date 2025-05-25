
import { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
// Correct way in Amplify v6+
import { Auth } from 'aws-amplify';
import PinkNavbar from '../components/navbar';

export default function ConfirmSignUp() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const confirm = async () => {
    try {
      await Auth.confirmSignUp(email, code);
      alert('Confirmed! You can now sign in.');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <PinkNavbar />
    <div>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input placeholder="Code" onChange={e => setCode(e.target.value)} />
      <button onClick={confirm}>Confirm</button>
    </div>
    </>
  );
}
