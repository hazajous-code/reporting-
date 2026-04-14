import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

const base = import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter basename={base}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
