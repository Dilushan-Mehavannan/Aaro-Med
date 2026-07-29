import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

const GOOGLE_ID = '878680274161-p0m53ejmcrdqv8suo3pp1ijqqjqjlp27.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
