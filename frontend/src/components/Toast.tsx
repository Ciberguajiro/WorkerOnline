import React, { useEffect } from 'react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface Props {
  toast: ToastItem;
  onRemove: (id: string) => void;
}

const Toast: React.FC<Props> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const colors = {
    success: { bg: 'rgba(78, 200, 115, 0.15)', border: 'var(--accent-green)', icon: '✅' },
    error: { bg: 'rgba(244, 71, 71, 0.15)', border: 'var(--accent-red)', icon: '❌' },
    info: { bg: 'rgba(0, 122, 204, 0.15)', border: 'var(--accent-blue)', icon: 'ℹ️' },
    warning: { bg: 'rgba(220, 220, 170, 0.15)', border: 'var(--accent-yellow)', icon: '⚠️' },
  };

  const style = colors[toast.type];

  return (
    <div
      style={{
        ...styles.container,
        backgroundColor: style.bg,
        borderLeft: `3px solid ${style.border}`,
      }}
    >
      <span style={styles.icon}>{style.icon}</span>
      <span style={styles.message}>{toast.message}</span>
      <button style={styles.close} onClick={() => onRemove(toast.id)}>
        ✕
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    animation: 'slideIn 0.3s ease',
    minWidth: '280px',
    maxWidth: '400px',
  },
  icon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  message: {
    flex: 1,
    lineHeight: '1.4',
  },
  close: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px',
    opacity: 0.7,
  },
};

export default Toast;
