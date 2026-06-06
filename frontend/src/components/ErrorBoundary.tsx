import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <h1 style={styles.title}>⚠️ Something went wrong</h1>
          <p style={styles.message}>
            The application crashed. Please refresh the page to try again.
          </p>
          <pre style={styles.details}>{this.state.error?.message}</pre>
          <button style={styles.button} onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '20px',
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    marginBottom: '12px',
    color: '#f14c4c',
  },
  message: {
    fontSize: '16px',
    marginBottom: '20px',
    opacity: 0.8,
  },
  details: {
    background: '#2d2d2d',
    padding: '12px 16px',
    borderRadius: '8px',
    maxWidth: '600px',
    overflow: 'auto',
    fontSize: '13px',
    marginBottom: '20px',
    color: '#f14c4c',
  },
  button: {
    padding: '10px 24px',
    fontSize: '14px',
    backgroundColor: '#2472c8',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};

export default ErrorBoundary;
