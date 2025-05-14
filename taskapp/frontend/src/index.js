import React from 'react';
import ReactDOM from 'react-dom/client';
import App from 'C:\Users\Hager\OneDrive\Desktop\clo\taskapp\frontend\src\app.js';
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
