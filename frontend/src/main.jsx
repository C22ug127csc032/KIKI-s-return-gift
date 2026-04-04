import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2800,
            style: {
              borderRadius: '12px',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: '13px',
              fontWeight: '500',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            },
            success: {
              style: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' },
              iconTheme: { primary: '#16a34a', secondary: '#f0fdf4' },
            },
            error: {
              style: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' },
              iconTheme: { primary: '#dc2626', secondary: '#fef2f2' },
            },
          }}
        />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
