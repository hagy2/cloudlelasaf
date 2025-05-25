// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import '@aws-amplify/ui-react/styles.css'; // Amplify UI styles
import './App.css';
import logo from './logo.svg';
import { Authenticator } from '@aws-amplify/ui-react';

// Import your auth components
import Signup from './auth/signup';
import Signin from './auth/SignIn';
import Signout from './auth/Signout';
import CuteHomepage from './home';
import TaskManager from './components/TaskManager';
 
import Profile from './components/profile';

function Home() {
  return (


      <Routes>
        <Route path="/" element={<CuteHomepage />} />
    </Routes>

  );
}




function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />



          <Route path="/tasks" element={<TaskManager />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signout" element={<Signout />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
