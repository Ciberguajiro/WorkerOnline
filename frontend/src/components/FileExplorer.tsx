import React, { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../hooks/useAuth';

interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
}

interface Props {
  workspace: string;
  token: string;
  onFileSelect: (path: string) => void;
}

const FileExplorer: React.FC<Props> = ({ workspace, token, onFileSelect }) => {
  const [tree, setTree] = useState<FileTreeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchTree = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(token, `/api/files/tree?workspace=${encodeURIComponent(workspace)}`);
      if (!res.ok) throw new Error('Failed to load file tree');
      const data = await res.json();
      setTree(data.tree || []);
    } catch {
      setError('Failed to load file tree');
    } finally {
      setLoading(false);
    }
  }, [workspace, token]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const toggleExpanded = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderTree = (items: FileTreeItem[], depth: number = 0) => {
    return items.map((item) => (
      <div key={item.path}>
        <div
          style={{
            ...styles.item,
            paddingLeft: `${12 + depth * 16}px`,
          }}
          onClick={() => {
            if (item.type === 'directory') {
              toggleExpanded(item.path);
            } else {
              onFileSelect(item.path);
            }
          }}
        >
          <span style={styles.icon}>
            {item.type === 'directory'
              ? expanded.has(item.path)
                ? '📂'
                : '📁'
              : '📄'}
          </span>
          <span style={styles.name}>{item.name}</span>
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
        <button style={styles.refresh} onClick={fetchTree} title="Refresh">
          ⟳
        </button>
      </div>
      {loading && <div style={styles.status}>Loading...</div>}
      {error && <div style={styles.error}>{error}</div>}
      {!loading && !error && tree.length === 0 && (
        <div style={styles.status}>No files found</div>
      )}
      <div style={styles.tree}>{renderTree(tree)}</div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '8px 0',
  },
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
  tree: {
    maxHeight: '400px',
    overflow: 'auto',
  },
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
  },
  icon: {
    fontSize: '14px',
    flexShrink: 0,
    width: '18px',
    textAlign: 'center',
  },
  name: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  status: {
    padding: '12px',
    color: 'var(--text-muted)',
    fontSize: '12px',
    textAlign: 'center',
  },
  error: {
    padding: '8px 12px',
    color: 'var(--accent-red)',
    fontSize: '12px',
  },
};

export default FileExplorer;
