import React from 'react';
import Dashboard from './Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ToastContainer';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Dashboard />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
