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
import TaskManager from './components/TaskManager';
 
import Profile from './components/profile';

function Home() {
  return (
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <p>Edit <code>src/App.js</code> and save to reload.</p>
      <nav>
        <Link to="/profile" className="App-link">Go to Profile</Link>|{' '}
        <Link to="/tasks" className="App-link">Go to Tasks</Link> |{' '}
        <Link to="/signin" className="App-link">Sign In</Link> |{' '}
        <Link to="/signup" className="App-link">Sign Up</Link> |{' '}
        <Link to="/signout" className="App-link">Sign Out</Link>
      </nav>
    </header>
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
