import React, { useEffect, useCallback } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>⌨️ Keyboard Shortcuts</h2>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        <div style={styles.content}>
          <ShortcutItem keys={['Ctrl', 'Shift', 'V']} description="Paste from clipboard" />
          <ShortcutItem keys={['Ctrl', 'Shift', 'C']} description="Copy selection" />
          <ShortcutItem keys={['Ctrl', 'L']} description="Clear terminal" />
          <ShortcutItem keys={['?']} description="Show this help" />
          <ShortcutItem keys={['Esc']} description="Close modal / sidebar" />
        </div>
      </div>
    </div>
  );
};

const ShortcutItem: React.FC<{ keys: string[]; description: string }> = ({ keys, description }) => (
  <div style={styles.item}>
    <div style={styles.keys}>
      {keys.map((k, i) => (
        <React.Fragment key={k}>
          <kbd style={styles.kbd}>{k}</kbd>
          {i < keys.length - 1 && <span style={styles.plus}>+</span>}
        </React.Fragment>
      ))}
    </div>
    <span style={styles.description}>{description}</span>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#2d2d2d',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #3e3e3e',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#d4d4d4',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#d4d4d4',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
  },
  content: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #3e3e3e',
  },
  keys: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  kbd: {
    backgroundColor: '#3e3e3e',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#d4d4d4',
    border: '1px solid #4e4e4e',
  },
  plus: {
    color: '#666',
    fontSize: '12px',
    margin: '0 2px',
  },
  description: {
    color: '#a0a0a0',
    fontSize: '14px',
  },
};

export default ShortcutsModal;
