import React, { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import Terminal from './Terminal';
import './styles.css';

const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [injectedCommand, setInjectedCommand] = useState('');
  const [commandId, setCommandId] = useState(0);

  const handleSelectWorkspace = useCallback((path: string) => {
    setSelectedWorkspace(path);
    setInjectedCommand(`cd ${path} && clear\n`);
    setCommandId((c) => c + 1);
  }, []);

  const handleInjectCommand = useCallback((cmd: string) => {
    setInjectedCommand(cmd);
    setCommandId((c) => c + 1);
  }, []);

  const handleCommandHandled = useCallback(() => {
    setInjectedCommand('');
  }, []);

  return (
    <div className="dashboard">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
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
