import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#1f2937',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 15px 30px -5px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb',
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: '#fff',
          },
          style: {
            border: '1px solid #22c55e20',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
          style: {
            border: '1px solid #ef444420',
          },
        },
        loading: {
          iconTheme: {
            primary: '#0ea5e9',
            secondary: '#fff',
          },
        },
      }}
    />
  );
};

export default ToastProvider;
