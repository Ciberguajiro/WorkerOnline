import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar';
import Terminal from './Terminal';
import './styles.css';

const Dashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [injectedCommand, setInjectedCommand] = useState('');
  const [commandId, setCommandId] = useState(0);

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
      />
      <div className="terminal-wrapper">
        <Terminal
          injectedCommand={injectedCommand}
          commandId={commandId}
          onCommandHandled={handleCommandHandled}
        />
      </div>
    </div>
  );
};

export default Dashboard;
