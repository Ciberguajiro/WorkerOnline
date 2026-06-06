import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar';
import Terminal from './Terminal';
import ThemeToggle from './components/ThemeToggle';
import ShortcutsModal from './components/ShortcutsModal';
import LoginModal from './components/LoginModal';
import CodeEditor from './components/CodeEditor';
import { useAuth, authFetch } from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import { useSound } from './hooks/useSound';
import './styles.css';

type Tab = 'terminal' | 'editor';

const Dashboard: React.FC = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { addToast } = useToast();
  const { play, enabled: soundEnabled, toggle: toggleSound } = useSound();
  
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [injectedCommand, setInjectedCommand] = useState('');
  const [commandId, setCommandId] = useState(0);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('terminal');
  const [activeFile, setActiveFile] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    if (mq.matches) setSidebarOpen(false);

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (e.matches) setSidebarOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLoginOpen(true);
    } else if (isAuthenticated) {
      setLoginOpen(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      addToast('success', 'Login successful');
      // eslint-disable-next-line react-hooks/exhaustive-deps
      play('success');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated]);

  const handleToggle = useCallback(() => {
    setSidebarOpen((o) => !o);
  }, []);

  const handleSelectWorkspace = useCallback((path: string) => {
    setSelectedWorkspace(path);
    setInjectedCommand(`cd ${path} && clear\n`);
    setCommandId((c) => c + 1);
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const handleInjectCommand = useCallback((cmd: string) => {
    setInjectedCommand(cmd);
    setCommandId((c) => c + 1);
  }, []);

  const handleCommandHandled = useCallback(() => {
    setInjectedCommand('');
  }, []);

  const handleFileSelect = useCallback((path: string) => {
    setActiveFile(path);
    setActiveTab('editor');
  }, []);

  const handleFileSaved = useCallback(() => {
    addToast('success', 'File saved successfully');
    play('success');
  }, [addToast, play]);

  const handleLogout = useCallback(() => {
    logout();
    addToast('info', 'Logged out');
    setActiveFile(null);
    setActiveTab('terminal');
  }, [logout, addToast]);

  const handleCloneRepo = useCallback(async (url: string) => {
    try {
      const res = await authFetch(
        localStorage.getItem('webterminal-token') || '',
        '/api/exec',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cmd: `git clone ${url}`, cwd: '/workspace' }),
        }
      );
      const data = await res.json();
      if (data.exitCode === 0) {
        addToast('success', 'Repository cloned successfully');
        play('success');
      } else {
        addToast('error', `Clone failed: ${data.error || data.output}`);
        play('error');
      }
    } catch {
      addToast('error', 'Failed to clone repository');
      play('error');
    }
  }, [addToast, play]);

  const handleCreateWorkspace = useCallback(async (name: string) => {
    try {
      const res = await authFetch(
        localStorage.getItem('webterminal-token') || '',
        '/api/exec',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cmd: `mkdir -p "${name}"`, cwd: '/workspace' }),
        }
      );
      const data = await res.json();
      if (data.exitCode === 0) {
        addToast('success', 'Workspace created successfully');
        play('success');
      } else {
        addToast('error', `Create failed: ${data.error || data.output}`);
        play('error');
      }
    } catch {
      addToast('error', 'Failed to create workspace');
      play('error');
    }
  }, [addToast, play]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        setShortcutsOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div
        className={`sidebar-backdrop ${isMobile && sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleToggle}
        selectedWorkspace={selectedWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        onInjectCommand={handleInjectCommand}
        onFileSelect={handleFileSelect}
        onCloneRepo={handleCloneRepo}
        onCreateWorkspace={handleCreateWorkspace}
        token={isAuthenticated ? localStorage.getItem('webterminal-token') || '' : ''}
      />
      <div className="main-panel">
        <div className="main-header">
          <div className="main-tabs">
            <button
              className={`main-tab ${activeTab === 'terminal' ? 'active' : ''}`}
              onClick={() => setActiveTab('terminal')}
            >
              💻 Terminal
            </button>
            <button
              className={`main-tab ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              📝 Code Editor
            </button>
          </div>
          <div className="main-actions">
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
              className="header-btn"
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
            <ThemeToggle />
            <button
              onClick={() => setShortcutsOpen(true)}
              title="Keyboard shortcuts (? )"
              className="header-btn"
            >
              ⌨️
            </button>
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                title={`Logged in as ${user?.username}`}
                className="header-btn"
              >
                👤 Logout
              </button>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                title="Login"
                className="header-btn"
              >
                🔒 Login
              </button>
            )}
          </div>
        </div>
        <div className="main-content">
          {activeTab === 'terminal' && (
            isAuthenticated ? (
              <Terminal
                key={isAuthenticated ? 'auth' : 'noauth'}
                injectedCommand={injectedCommand}
                commandId={commandId}
                onCommandHandled={handleCommandHandled}
                token={localStorage.getItem('webterminal-token') || ''}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', gap: 16 }}>
                <div style={{ fontSize: 48, opacity: 0.5 }}>🔒</div>
                <div style={{ fontSize: 16 }}>Please login to use the terminal</div>
                <button
                  onClick={() => setLoginOpen(true)}
                  style={{ padding: '10px 24px', borderRadius: 6, border: 'none', backgroundColor: 'var(--accent-blue)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Login
                </button>
              </div>
            )
          )}
          {activeTab === 'editor' && (
            <CodeEditor
              token={localStorage.getItem('webterminal-token') || ''}
              activeFile={activeFile}
              onActiveFileChange={setActiveFile}
              onFileSaved={handleFileSaved}
            />
          )}
        </div>
      </div>
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <LoginModal isOpen={loginOpen} onClose={() => isAuthenticated && setLoginOpen(false)} />
    </div>
  );
};

export default Dashboard;
