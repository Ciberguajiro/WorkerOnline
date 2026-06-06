import React, { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../hooks/useAuth';

interface Session {
  name: string;
  createdAt: number;
  attached: boolean;
}

interface Props {
  token: string;
  onConnectSession: (sessionId: string) => void;
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const SessionsPanel: React.FC<Props> = ({ token, onConnectSession }) => {
  const [open, setOpen] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await authFetch(token, '/api/sessions');
      if (!res.ok) return;
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      // silent — sessions panel is non-critical
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-refresh every 30s while panel is open
  useEffect(() => {
    if (!open) return;
    const id = setInterval(fetchSessions, 30000);
    return () => clearInterval(id);
  }, [open, fetchSessions]);

  const handleKill = async (name: string) => {
    if (!window.confirm(`Kill session "${name}"? Any running process inside will be terminated.`)) return;
    try {
      await authFetch(token, `/api/sessions/${encodeURIComponent(name)}`, { method: 'DELETE' });
      fetchSessions();
    } catch { /* ignore */ }
  };

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header" onClick={() => setOpen((o) => !o)}>
        <span>⚡ Background Sessions</span>
        <span className={`arrow ${open ? 'open' : ''}`}>▶</span>
      </div>
      <div className={`sidebar-section-content ${open ? 'open' : ''}`}>
        <div style={styles.toolbar}>
          <span style={styles.hint}>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
          <button style={styles.refreshBtn} onClick={fetchSessions} title="Refresh">
            {loading ? '…' : '⟳'}
          </button>
        </div>
        {sessions.length === 0 && !loading && (
          <div style={styles.empty}>No background sessions</div>
        )}
        {sessions.map((s) => (
          <div key={s.name} style={styles.row}>
            <span style={{ ...styles.dot, color: s.attached ? '#23d18b' : '#666' }}>
              {s.attached ? '🟢' : '⚪'}
            </span>
            <div style={styles.info}>
              <span style={styles.name} title={s.name}>{s.name.replace('wt-', '')}</span>
              <span style={styles.meta}>{timeAgo(s.createdAt)}{s.attached ? ' · attached' : ' · detached'}</span>
            </div>
            <div style={styles.btns}>
              <button
                style={styles.connectBtn}
                onClick={() => onConnectSession(s.name)}
                title="Open in terminal tab"
              >
                Connect
              </button>
              <button
                style={styles.killBtn}
                onClick={() => handleKill(s.name)}
                title="Kill session"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 12px 6px',
  },
  hint: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  refreshBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '13px',
    padding: '2px 4px',
  },
  empty: {
    padding: '8px 12px 12px',
    color: 'var(--text-muted)',
    fontSize: '12px',
    textAlign: 'center',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    fontSize: '12px',
  },
  dot: {
    fontSize: '10px',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  name: {
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
    fontSize: '12px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    color: 'var(--text-muted)',
    fontSize: '11px',
  },
  btns: {
    display: 'flex',
    gap: '4px',
    flexShrink: 0,
  },
  connectBtn: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid var(--accent-blue)',
    background: 'none',
    color: 'var(--accent-blue)',
    cursor: 'pointer',
  },
  killBtn: {
    fontSize: '11px',
    padding: '2px 5px',
    borderRadius: '4px',
    border: 'none',
    background: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
};

export default SessionsPanel;
