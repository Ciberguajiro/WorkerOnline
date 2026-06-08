import React, { useState, useEffect } from 'react';
import { useSocket } from './contexts/SocketContext';
import type { ExecResult } from './contexts/SocketContext';

interface Props {
  workspacePath: string;
  branch: string;
  isGitRepo: boolean;
}

const GitPanel: React.FC<Props> = ({ workspacePath, branch, isGitRepo }) => {
  const { socket, gitStatus, gitPull, gitPush } = useSocket();
  const [open, setOpen] = useState(true);
  const [output, setOutput] = useState('');
  const [outputVisible, setOutputVisible] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const gitOutputHandler = (data: { stdout: string; stderr: string }) => {
      const out = data.stdout + (data.stderr ? '\n' + data.stderr : '');
      setOutput((prev) => prev + out);
      setIsRunning(false);
    };

    const execOutputHandler = (data: ExecResult) => {
      setOutput((prev) => prev + data.output);
      if (data.exitCode !== 0 || data.error) {
        setIsError(true);
      }
      setIsRunning(false);
    };

    socket.on('git:output', gitOutputHandler);
    socket.on('exec:output', execOutputHandler);

    return () => {
      socket.off('git:output', gitOutputHandler);
      socket.off('exec:output', execOutputHandler);
    };
  }, [socket]);

  const execCmd = (cmd: string) => {
    setIsRunning(true);
    setOutput(`$ ${cmd}\n`);
    setOutputVisible(true);
    setIsError(false);
  };

  if (!isGitRepo) {
    return (
      <div className="sidebar-section">
        <div className="sidebar-section-header" onClick={() => setOpen(!open)}>
          <span>🔀 GitHub</span>
          <span className={`arrow ${open ? 'open' : ''}`}>▶</span>
        </div>
        <div className={`sidebar-section-content ${open ? 'open' : ''}`}>
          <div className="git-no-repo">Select a git workspace</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header" onClick={() => setOpen(!open)}>
        <span>🔀 GitHub</span>
        <span className={`arrow ${open ? 'open' : ''}`}>▶</span>
      </div>
      <div className={`sidebar-section-content ${open ? 'open' : ''}`}>
        <div className="git-info">
          {branch ? (
            <div className="git-branch-display">
              <span className="branch-icon">⎇</span>
              <span>{branch}</span>
            </div>
          ) : (
            <div style={{ color: '#858585', fontSize: 12, marginBottom: 8 }}>No branch</div>
          )}
        </div>
        <div className="git-btn-row">
          <button
            className="git-btn status-btn"
            disabled={isRunning}
            onClick={() => {
              execCmd('git status --short');
              gitStatus(workspacePath);
            }}
          >
            Status
          </button>
          <button
            className="git-btn pull"
            disabled={isRunning}
            onClick={() => {
              execCmd('git pull');
              gitPull(workspacePath);
            }}
          >
            Pull
          </button>
          <button
            className="git-btn push"
            disabled={isRunning}
            onClick={() => {
              execCmd('git push');
              gitPush(workspacePath);
            }}
          >
            Push
          </button>
        </div>
        <div className={`git-output ${outputVisible ? 'visible' : ''}`}>
          <div className={`git-output-inner ${isError ? 'error' : ''} ${isRunning ? 'loading' : ''}`}>
            {output || (isRunning ? 'Running...' : '')}
          </div>
          <button
            className="git-output-clear"
            onClick={() => { setOutput(''); setOutputVisible(false); setIsError(false); }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default GitPanel;
