import React, { useState } from 'react';

export type WorkspaceModalType = 'clone' | 'new';

interface Props {
  isOpen: boolean;
  type: WorkspaceModalType;
  onClose: () => void;
  onSubmit: (value: string) => void;
}

const WorkspaceModal: React.FC<Props> = ({ isOpen, type, onClose, onSubmit }) => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isClone = type === 'clone';
  const title = isClone ? '📥 Clone Repository' : '📁 New Workspace';
  const placeholder = isClone ? 'https://github.com/user/repo.git' : 'my-project';
  const btnLabel = isClone ? 'Clone' : 'Create';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!value.trim()) {
      setError(isClone ? 'Please enter a repository URL' : 'Please enter a workspace name');
      return;
    }
    setLoading(true);
    onSubmit(value.trim());
    setLoading(false);
    setValue('');
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.field}>
            <label style={styles.label}>
              {isClone ? 'GitHub URL' : 'Workspace Name'}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              style={styles.input}
              placeholder={placeholder}
              autoFocus
              required
            />
          </div>
          {isClone && (
            <div style={styles.hint}>
              Example: https://github.com/octocat/Hello-World.git
            </div>
          )}
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? '⏳ Processing...' : btnLabel}
          </button>
        </form>
      </div>
    </div>
  );
};

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
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    border: '1px solid var(--border-color)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-color)',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: 'var(--text-primary)',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
  },
  form: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  error: {
    backgroundColor: 'rgba(244, 71, 71, 0.1)',
    color: 'var(--accent-red)',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '14px',
    border: '1px solid var(--accent-red)',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
  },
  hint: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '-10px',
  },
  button: {
    padding: '12px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'var(--accent-blue)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
};

export default WorkspaceModal;
