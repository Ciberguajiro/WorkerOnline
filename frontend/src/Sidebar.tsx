import React, { useState } from 'react';
import WorkspacePanel from './WorkspacePanel';
import GitPanel from './GitPanel';
import AIToolsPanel from './AIToolsPanel';
import FileExplorer from './components/FileExplorer';

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
  token: string;
}

const Sidebar: React.FC<Props> = ({
  isOpen,
  onToggle,
  selectedWorkspace,
  onSelectWorkspace,
  onInjectCommand,
  onFileSelect,
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
            token={token}
          />
          <GitPanel
            workspacePath={selectedWorkspace}
            branch={currentWs?.branch || ''}
            isGitRepo={currentWs?.isGitRepo || false}
            token={token}
          />
          <AIToolsPanel onInjectCommand={onInjectCommand} />
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
