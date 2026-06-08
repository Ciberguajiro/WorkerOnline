import React from 'react';
import Dashboard from './Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ToastProvider } from './components/ToastContainer';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              <Dashboard />
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
