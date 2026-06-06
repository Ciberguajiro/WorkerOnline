import React, { useState } from 'react';
import WorkspacePanel from './WorkspacePanel';
import GitPanel from './GitPanel';
import AIToolsPanel from './AIToolsPanel';
import FileExplorer from './components/FileExplorer';
import SessionsPanel from './components/SessionsPanel';

interface WorkspaceItem {
  name: string;
  path: string;
  isGitRepo: boolean;
  branch: string;
}

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  selectedWorkspace: string;
  onSelectWorkspace: (path: string) => void;
  onInjectCommand: (cmd: string) => void;
  onFileSelect: (path: string) => void;
  onCloneRepo?: (url: string) => void;
  onCreateWorkspace?: (name: string) => void;
  onConnectSession?: (sessionId: string) => void;
  token: string;
}

const Sidebar: React.FC<Props> = ({
  isOpen,
  onToggle,
  selectedWorkspace,
  onSelectWorkspace,
  onInjectCommand,
  onFileSelect,
  onCloneRepo,
  onCreateWorkspace,
  onConnectSession,
  token,
}) => {
  const [currentWs, setCurrentWs] = useState<WorkspaceItem | null>(null);

  return (
    <>
      <button className="sidebar-toggle" onClick={onToggle} title={isOpen ? 'Close sidebar' : 'Open sidebar'}>
        {isOpen ? '◀' : '☰'}
      </button>
      <div className={`sidebar ${isOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-inner">
          <WorkspacePanel
            selectedWorkspace={selectedWorkspace}
            onSelectWorkspace={onSelectWorkspace}
            onWorkspaceChange={setCurrentWs}
            onCloneRepo={onCloneRepo}
            onCreateWorkspace={onCreateWorkspace}
            token={token}
          />
          <GitPanel
            workspacePath={selectedWorkspace}
            branch={currentWs?.branch || ''}
            isGitRepo={currentWs?.isGitRepo || false}
            token={token}
          />
          <AIToolsPanel onInjectCommand={onInjectCommand} />
          {token && (
            <SessionsPanel
              token={token}
              onConnectSession={onConnectSession ?? (() => {})}
            />
          )}
          {selectedWorkspace && (
            <FileExplorer
              workspace={selectedWorkspace.split('/').pop() || ''}
              token={token}
              onFileSelect={onFileSelect}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
