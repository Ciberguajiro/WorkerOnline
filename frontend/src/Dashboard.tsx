import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import Sidebar from './Sidebar';
import Terminal from './Terminal';
import ThemeToggle from './components/ThemeToggle';
import ShortcutsModal from './components/ShortcutsModal';
import LoginModal from './components/LoginModal';
import { useAuth, authFetch } from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import { useSound } from './hooks/useSound';
import './styles.css';

const CodeEditor = lazy(() => import('./components/CodeEditor'));

interface TerminalTab {
  id: string;
  label: string;
}

const generateSessionId = () => `wt-${Math.random().toString(36).slice(2, 10)}`;

let tabCounter = 0;

const getInitialTabs = (): { tabs: TerminalTab[]; activeTabId: string } => {
  try {
    const saved = localStorage.getItem('wt-tabs');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.tabs) && parsed.tabs.length > 0) {
        tabCounter = parsed.tabs.length;
        return { tabs: parsed.tabs, activeTabId: parsed.activeTabId || parsed.tabs[0].id };
      }
    }
  } catch { /* ignore */ }
  tabCounter = 1;
  const id = generateSessionId();
  return { tabs: [{ id, label: 'Terminal 1' }], activeTabId: id };
};

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
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const initial = getInitialTabs();
  const [terminalTabs, setTerminalTabs] = useState<TerminalTab[]>(initial.tabs);
  const [activeTabId, setActiveTabId] = useState<string>(initial.activeTabId);

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
    setActiveTabId((cur) => cur === 'editor' ? terminalTabs[0]?.id ?? 't1' : cur);
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, terminalTabs]);

  const handleInjectCommand = useCallback((cmd: string) => {
    setInjectedCommand(cmd);
    setCommandId((c) => c + 1);
  }, []);

  const handleCommandHandled = useCallback(() => {
    setInjectedCommand('');
  }, []);

  const handleFileSelect = useCallback((path: string) => {
    setActiveFile(path);
    setActiveTabId('editor');
  }, []);

  const handleFileSaved = useCallback(() => {
    addToast('success', 'File saved successfully');
    play('success');
  }, [addToast, play]);

  const handleLogout = useCallback(() => {
    logout();
    addToast('info', 'Logged out');
    setActiveFile(null);
    const firstTab = terminalTabs[0];
    setActiveTabId(firstTab?.id ?? 't1');
  }, [logout, addToast, terminalTabs]);

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

  // Persist tabs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('wt-tabs', JSON.stringify({ tabs: terminalTabs, activeTabId }));
  }, [terminalTabs, activeTabId]);

  const handleConnectSession = useCallback((sessionId: string) => {
    const existing = terminalTabs.find((t) => t.id === sessionId);
    if (existing) {
      setActiveTabId(sessionId);
      return;
    }
    const label = `Session ${sessionId.slice(3, 9)}`;
    setTerminalTabs((prev) => [...prev, { id: sessionId, label }]);
    setActiveTabId(sessionId);
  }, [terminalTabs]);

  const addTerminalTab = useCallback(() => {
    tabCounter += 1;
    const id = generateSessionId();
    const label = `Terminal ${tabCounter}`;
    setTerminalTabs((tabs) => [...tabs, { id, label }]);
    setActiveTabId(id);
  }, []);

  const closeTerminalTab = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTerminalTabs((tabs) => {
      const next = tabs.filter((t) => t.id !== id);
      if (next.length === 0) {
        tabCounter += 1;
        const newId = generateSessionId();
        const newTab = { id: newId, label: `Terminal ${tabCounter}` };
        setActiveTabId(newId);
        return [newTab];
      }
      // if closing active tab, switch to adjacent
      setActiveTabId((current) => {
        if (current !== id) return current;
        const idx = tabs.findIndex((t) => t.id === id);
        return next[Math.min(idx, next.length - 1)].id;
      });
      return next;
    });
  }, []);

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

  const token = isAuthenticated ? localStorage.getItem('webterminal-token') || '' : '';

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
        onConnectSession={handleConnectSession}
        token={token}
      />
      <div className="main-panel">
        <div className="main-header">
          <div className="main-tabs">
            {terminalTabs.map((tab) => (
              <button
                key={tab.id}
                className={`main-tab ${activeTabId === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTabId(tab.id)}
              >
                💻 {tab.label}
                {terminalTabs.length > 1 && (
                  <span
                    className="tab-close"
                    onClick={(e) => closeTerminalTab(tab.id, e)}
                    title="Close tab"
                  >
                    ×
                  </span>
                )}
              </button>
            ))}
            <button
              className="main-tab tab-add"
              onClick={addTerminalTab}
              title="New terminal"
            >
              +
            </button>
            <button
              className={`main-tab ${activeTabId === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTabId('editor')}
            >
              📝 Editor
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
              title="Keyboard shortcuts (?)"
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
          {terminalTabs.map((tab) => (
            <div
              key={tab.id}
              style={{ display: activeTabId === tab.id ? 'flex' : 'none', flex: 1, flexDirection: 'column', height: '100%' }}
            >
              {isAuthenticated ? (
                <Terminal
                  sessionId={tab.id}
                  injectedCommand={injectedCommand}
                  commandId={activeTabId === tab.id ? commandId : 0}
                  onCommandHandled={handleCommandHandled}
                  token={token}
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
              )}
            </div>
          ))}
          {activeTabId === 'editor' && (
            <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)' }}>Loading editor...</div>}>
              <CodeEditor
                token={token}
                activeFile={activeFile}
                onActiveFileChange={setActiveFile}
                onFileSaved={handleFileSaved}
              />
            </Suspense>
          )}
        </div>
      </div>
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <LoginModal isOpen={loginOpen} onClose={() => isAuthenticated && setLoginOpen(false)} />
    </div>
  );
};

export default Dashboard;
