import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import type { FileTreeItem } from '../contexts/SocketContext';

interface Props {
  workspace: string;
  onFileSelect: (path: string) => void;
}

const FileExplorer: React.FC<Props> = ({ workspace, onFileSelect }) => {
  const { socket, getFileTree } = useSocket();
  const [tree, setTree] = useState<FileTreeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fetchTree = useCallback(() => {
    if (!workspace) return;
    setLoading(true);
    setError('');
    getFileTree(workspace);
    setLoading(false);
  }, [workspace, getFileTree]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  useEffect(() => {
    if (!socket) return;

    const treeUpdateHandler = (data: { tree: FileTreeItem[] }) => {
      setTree(data.tree || []);
      setLoading(false);
    };

    socket.on('file-tree:update', treeUpdateHandler);

    return () => {
      socket.off('file-tree:update', treeUpdateHandler);
    };
  }, [socket]);

  const toggleExpanded = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleNewFile = async (e: React.MouseEvent, dirPath: string) => {
    e.stopPropagation();
    const name = window.prompt('New file name:');
    if (!name) return;
    const filePath = `${dirPath}/${name}`;
    await authFetch(token, '/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content: '' }),
    });
    fetchTree();
  };

  const handleNewDir = async (e: React.MouseEvent, dirPath: string) => {
    e.stopPropagation();
    const name = window.prompt('New folder name:');
    if (!name) return;
    const newPath = `${dirPath}/${name}`;
    await authFetch(token, '/api/files/mkdir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: newPath }),
    });
    fetchTree();
  };

  const handleDelete = async (e: React.MouseEvent, item: FileTreeItem) => {
    e.stopPropagation();
    if (!window.confirm(`Delete ${item.type === 'directory' ? 'folder' : 'file'} "${item.name}"?`)) return;
    await authFetch(token, '/api/files', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: item.path }),
    });
    fetchTree();
  };

  const startRename = (e: React.MouseEvent, item: FileTreeItem) => {
    e.stopPropagation();
    setRenamingPath(item.path);
    setRenameValue(item.name);
  };

  const commitRename = async (item: FileTreeItem) => {
    if (!renameValue || renameValue === item.name) {
      setRenamingPath(null);
      return;
    }
    const dir = item.path.includes('/') ? item.path.substring(0, item.path.lastIndexOf('/')) : '';
    const toPath = dir ? `${dir}/${renameValue}` : renameValue;
    await authFetch(token, '/api/files/rename', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: item.path, to: toPath }),
    });
    setRenamingPath(null);
    fetchTree();
  };

  const renderTree = (items: FileTreeItem[], depth: number = 0) => {
    return items.map((item) => (
      <div key={item.path}>
        <div
          style={{ ...styles.item, paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => {
            if (item.type === 'directory') toggleExpanded(item.path);
            else onFileSelect(item.path);
          }}
        >
          <span style={styles.icon}>
            {item.type === 'directory' ? (expanded.has(item.path) ? '📂' : '📁') : '📄'}
          </span>
          {renamingPath === item.path ? (
            <input
              autoFocus
              style={styles.renameInput}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => commitRename(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename(item);
                if (e.key === 'Escape') setRenamingPath(null);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span style={styles.name} onDoubleClick={(e) => startRename(e, item)}>
              {item.name}
            </span>
          )}
          <span style={styles.actions} className="file-actions">
            {item.type === 'directory' && (
              <>
                <button style={styles.actionBtn} title="New file" onClick={(e) => handleNewFile(e, item.path)}>+f</button>
                <button style={styles.actionBtn} title="New folder" onClick={(e) => handleNewDir(e, item.path)}>+d</button>
              </>
            )}
            <button style={styles.actionBtn} title="Rename" onClick={(e) => startRename(e, item)}>✎</button>
            <button style={{ ...styles.actionBtn, color: 'var(--accent-red, #f44)' }} title="Delete" onClick={(e) => handleDelete(e, item)}>✕</button>
          </span>
        </div>
        {item.type === 'directory' &&
          expanded.has(item.path) &&
          item.children &&
          renderTree(item.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>🗂️ File Explorer</span>
        <button style={styles.refresh} onClick={fetchTree} title="Refresh">⟳</button>
      </div>
      {loading && <div style={styles.status}>Loading...</div>}
      {error && <div style={styles.error}>{error}</div>}
      {!loading && !error && tree.length === 0 && (
        <div style={styles.status}>No files found</div>
      )}
      <div style={styles.tree}>{renderTree(tree)}</div>
      <style>{`
        .file-actions { display: none !important; }
        div:hover > div > .file-actions { display: inline-flex !important; }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '8px 0' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 12px 8px',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '4px',
  },
  title: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  refresh: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '2px',
  },
  tree: { maxHeight: '400px', overflow: 'auto' },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--text-primary)',
    transition: 'background-color 0.1s',
    userSelect: 'none',
    position: 'relative',
  },
  icon: { fontSize: '14px', flexShrink: 0, width: '18px', textAlign: 'center' as const },
  name: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  renameInput: {
    flex: 1,
    fontSize: '13px',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--accent-blue)',
    borderRadius: '3px',
    padding: '1px 4px',
    outline: 'none',
  },
  actions: {
    display: 'none',
    alignItems: 'center',
    gap: '2px',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '11px',
    color: 'var(--text-muted)',
    padding: '1px 3px',
    borderRadius: '2px',
    lineHeight: 1,
  },
  status: { padding: '12px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' as const },
  error: { padding: '8px 12px', color: 'var(--accent-red)', fontSize: '12px' },
};

export default FileExplorer;
