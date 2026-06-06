import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from './contexts/AuthContext';

interface WorkspaceItem {
  name: string;
  path: string;
  isGitRepo: boolean;
  branch: string;
}

interface Props {
  selectedWorkspace: string;
  onSelectWorkspace: (path: string) => void;
  onWorkspaceChange: (item: WorkspaceItem | null) => void;
  onFileSelect?: (path: string) => void;
  token: string;
}

const WorkspacePanel: React.FC<Props> = ({ selectedWorkspace, onSelectWorkspace, onWorkspaceChange, onFileSelect, token }) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(token, '/api/workspaces');
      const data = await res.json();
      setWorkspaces(data.workspaces || []);
    } catch {
      setError('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleSelect = (item: WorkspaceItem) => {
    onSelectWorkspace(item.path);
    onWorkspaceChange(item);
  };

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header" onClick={() => setOpen(!open)}>
        <span>📁 Workspaces</span>
        <span className={`arrow ${open ? 'open' : ''}`}>▶</span>
      </div>
      <div className={`sidebar-section-content ${open ? 'open' : ''}`}>
        <div className="workspace-list">
          {loading && <div className="workspace-empty">Loading...</div>}
          {error && <div className="error-text">{error}</div>}
          {!loading && !error && workspaces.length === 0 && (
            <div className="workspace-empty">No workspaces found</div>
          )}
          {!loading && workspaces.map((ws) => (
            <div
              key={ws.path}
              className={`workspace-item ${selectedWorkspace === ws.path ? 'active' : ''}`}
              onClick={() => handleSelect(ws)}
            >
              <span className="icon">{ws.isGitRepo ? '🔀' : '📂'}</span>
              <span>{ws.name}</span>
              {ws.branch && <span className="branch">{ws.branch}</span>}
              {onFileSelect && (
                <button
                  className="workspace-explore"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectWorkspace(ws.path);
                    onWorkspaceChange(ws);
                    // Open first file or trigger explore
                  }}
                  title="Explore files"
                >
                  📂
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          className="workspace-refresh"
          onClick={(e) => { e.stopPropagation(); fetchWorkspaces(); }}
        >
          ⟳ Refresh
        </button>
      </div>
    </div>
  );
};

export default WorkspacePanel;
