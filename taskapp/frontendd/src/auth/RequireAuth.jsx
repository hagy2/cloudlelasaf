import { Auth } from 'aws-amplify';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

function RequireAuth({ children }) {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(() => setIsAuth(true))
      .catch(() => setIsAuth(false));
  }, []);

  if (isAuth === null) return <div>Loading...</div>;
  return isAuth ? children : <Navigate to="/signin" />;
}

export default RequireAuth;
