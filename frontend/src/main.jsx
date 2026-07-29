import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

const rawGoogleId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '482164433654-ccvpjtb81oebm1r6r2trm9btet9aq5ip.apps.googleusercontent.com';
const GOOGLE_ID = String(rawGoogleId).trim();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
