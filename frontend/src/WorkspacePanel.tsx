import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from './contexts/SocketContext';
import WorkspaceModal from './components/WorkspaceModal';

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
  onCloneRepo?: (url: string) => void;
  onCreateWorkspace?: (name: string) => void;
}

const WorkspacePanel: React.FC<Props> = ({
  selectedWorkspace,
  onSelectWorkspace,
  onWorkspaceChange,
  onFileSelect,
  onCloneRepo,
  onCreateWorkspace,
}) => {
  const { listWorkspaces, selectWorkspace } = useSocket();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'clone' | 'new'>('clone');

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listWorkspaces();
      setWorkspaces(data.workspaces || []);
    } catch {
      setError('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, [listWorkspaces]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleSelect = (item: WorkspaceItem) => {
    onSelectWorkspace(item.path);
    onWorkspaceChange(item);
    selectWorkspace(item.path);
  };

  const handleModalSubmit = (value: string) => {
    if (modalType === 'clone') {
      onCloneRepo?.(value);
    } else {
      onCreateWorkspace?.(value);
    }
    setModalOpen(false);
  };

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header" onClick={() => setOpen(!open)}>
        <span>📁 Workspaces</span>
        <span className={`arrow ${open ? 'open' : ''}`}>▶</span>
      </div>
      <div className={`sidebar-section-content ${open ? 'open' : ''}`}>
        <div className="workspace-actions">
          <button
            className="workspace-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setModalType('clone');
              setModalOpen(true);
            }}
            title="Clone repository"
          >
            📥 Clone
          </button>
          <button
            className="workspace-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setModalType('new');
              setModalOpen(true);
            }}
            title="New workspace"
          >
            📁 New
          </button>
        </div>
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
      <WorkspaceModal
        isOpen={modalOpen}
        type={modalType}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default WorkspacePanel;
