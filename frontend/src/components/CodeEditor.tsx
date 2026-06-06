import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { useTheme } from '../hooks/useTheme';
import { authFetch } from '../hooks/useAuth';

interface OpenFile {
  path: string;
  content: string;
  originalContent: string;
  language: string;
}

interface Props {
  token: string;
  activeFile: string | null;
  onActiveFileChange: (path: string | null) => void;
  onFileSaved: () => void;
}

const CodeEditor: React.FC<Props> = ({ token, activeFile, onActiveFileChange, onFileSaved }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { theme } = useTheme();
  const [files, setFiles] = useState<OpenFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getLanguage = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return javascript({ jsx: ext.includes('x'), typescript: ext.startsWith('ts') });
      case 'json':
        return json();
      case 'md':
      case 'markdown':
        return markdown();
      case 'py':
        return python();
      default:
        return javascript();
    }
  };

  const getExtension = (path: string) => path.split('.').pop()?.toLowerCase() || 'txt';

  // Load file when activeFile changes
  const initEditor = useCallback((file: OpenFile) => {
    if (!editorRef.current) return;

    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const extensions = [
      keymap.of([...defaultKeymap, indentWithTab]),
      getLanguage(file.path),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString();
          setFiles((prev) =>
            prev.map((f) => (f.path === file.path ? { ...f, content: newContent } : f))
          );
        }
      }),
    ];

    if (theme === 'dark') {
      extensions.push(oneDark);
    }

    const state = EditorState.create({
      doc: file.content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
  }, [theme]);

  useEffect(() => {
    if (!activeFile) {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      return;
    }

    const existingFile = files.find((f) => f.path === activeFile);
    if (existingFile) {
      initEditor(existingFile);
      return;
    }

    setLoading(true);
    setError('');
    authFetch(token, `/api/files?path=${encodeURIComponent(activeFile)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load file');
        const data = await res.json();
        const newFile: OpenFile = {
          path: activeFile,
          content: data.content,
          originalContent: data.content,
          language: getExtension(activeFile),
        };
        setFiles((prev) => [...prev, newFile]);
        initEditor(newFile);
      })
      .catch(() => {
        setError('Failed to load file');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeFile, files, initEditor, token]);

  const handleSave = async () => {
    const currentFile = files.find((f) => f.path === activeFile);
    if (!currentFile) return;

    try {
      const res = await authFetch(token, '/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentFile.path, content: currentFile.content }),
      });

      if (!res.ok) throw new Error('Failed to save');

      setFiles((prev) =>
        prev.map((f) => (f.path === currentFile.path ? { ...f, originalContent: currentFile.content } : f))
      );
      onFileSaved();
    } catch {
      setError('Failed to save file');
    }
  };

  const closeFile = (path: string) => {
    setFiles((prev) => prev.filter((f) => f.path !== path));
    if (activeFile === path) {
      const remaining = files.filter((f) => f.path !== path);
      onActiveFileChange(remaining.length > 0 ? remaining[0].path : null);
    }
  };

  const currentFile = files.find((f) => f.path === activeFile);
  const hasChanges = currentFile ? currentFile.content !== currentFile.originalContent : false;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.tabs}>
          {files.map((file) => (
            <div
              key={file.path}
              style={{
                ...styles.tab,
                ...(activeFile === file.path ? styles.activeTab : {}),
              }}
              onClick={() => onActiveFileChange(file.path)}
            >
              <span style={styles.tabName}>{file.path.split('/').pop()}</span>
              {file.content !== file.originalContent && (
                <span style={styles.dot}>●</span>
              )}
              <button
                style={styles.closeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file.path);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div style={styles.actions}>
          <button
            style={{
              ...styles.saveBtn,
              ...(hasChanges ? styles.saveBtnActive : {}),
            }}
            onClick={handleSave}
            disabled={!hasChanges}
            title={hasChanges ? 'Save (Ctrl+S)' : 'No changes'}
          >
            💾 {hasChanges ? 'Save*' : 'Saved'}
          </button>
        </div>
      </div>
      {loading && <div style={styles.loading}>Loading...</div>}
      {error && <div style={styles.error}>{error}</div>}
      {!activeFile && !loading && (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📄</div>
          <div style={styles.emptyText}>Select a file from the explorer to edit</div>
        </div>
      )}
      <div ref={editorRef} style={styles.editor} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'var(--bg-primary)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    minHeight: '36px',
  },
  tabs: {
    display: 'flex',
    flex: 1,
    overflow: 'auto',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    borderRight: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    userSelect: 'none',
    transition: 'background-color 0.1s',
  },
  activeTab: {
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    borderBottom: '2px solid var(--accent-blue)',
  },
  tabName: {
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dot: {
    color: 'var(--accent-yellow)',
    fontSize: '10px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '0 2px',
    opacity: 0.6,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    gap: '8px',
  },
  saveBtn: {
    padding: '4px 10px',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    fontSize: '11px',
    cursor: 'not-allowed',
    fontWeight: '500',
  },
  saveBtnActive: {
    backgroundColor: 'var(--accent-blue)',
    color: '#fff',
    cursor: 'pointer',
    borderColor: 'var(--accent-blue)',
  },
  loading: {
    padding: '20px',
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
  error: {
    padding: '10px',
    color: 'var(--accent-red)',
    fontSize: '12px',
    textAlign: 'center',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: 'var(--text-muted)',
    gap: '12px',
  },
  emptyIcon: {
    fontSize: '48px',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '14px',
  },
  editor: {
    flex: 1,
    overflow: 'hidden',
  },
};

export default CodeEditor;
