import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

const GOOGLE_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '432702684432-pe2lqnde7l3cucfu424hcfubqorgfjoi.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
