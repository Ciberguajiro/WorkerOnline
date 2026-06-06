import React, { useState } from 'react';
import { authFetch } from './contexts/AuthContext';

interface Props {
  workspacePath: string;
  branch: string;
  isGitRepo: boolean;
  token: string;
}

interface ExecResult {
  output: string;
  exitCode: number;
  error: string | null;
}

const GitPanel: React.FC<Props> = ({ workspacePath, branch, isGitRepo, token }) => {
  const [open, setOpen] = useState(true);
  const [output, setOutput] = useState('');
  const [outputVisible, setOutputVisible] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isError, setIsError] = useState(false);

  const execCommand = async (cmd: string) => {
    setIsRunning(true);
    setOutput(`$ ${cmd}\n`);
    setOutputVisible(true);
    setIsError(false);

    try {
      const res = await authFetch(token, '/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd, cwd: workspacePath }),
      });
      const data: ExecResult = await res.json();
      
      setOutput((prev) => `${prev}${data.output}`);
      if (data.exitCode !== 0 || data.error) {
        setIsError(true);
      }
    } catch (err: any) {
      setOutput((prev) => `${prev}Error: ${err.message || 'Failed to execute'}\n`);
      setIsError(true);
    } finally {
      setIsRunning(false);
    }
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
            onClick={() => execCommand('git status --short')}
          >
            Status
          </button>
          <button
            className="git-btn pull"
            disabled={isRunning}
            onClick={() => execCommand('git pull')}
          >
            Pull
          </button>
          <button
            className="git-btn push"
            disabled={isRunning}
            onClick={() => execCommand('git push')}
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
