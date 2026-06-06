import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar';
import Terminal from './Terminal';
import ThemeToggle from './components/ThemeToggle';
import ShortcutsModal from './components/ShortcutsModal';
import LoginModal from './components/LoginModal';
import CodeEditor from './components/CodeEditor';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './components/ToastContainer';
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
      addToast('success', 'Login successful');
      play('success');
    }
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
            <Terminal
              injectedCommand={injectedCommand}
              commandId={commandId}
              onCommandHandled={handleCommandHandled}
            />
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
