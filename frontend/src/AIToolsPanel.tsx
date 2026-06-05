import React, { useState } from 'react';

interface Props {
  onInjectCommand: (cmd: string) => void;
}

const AIToolsPanel: React.FC<Props> = ({ onInjectCommand }) => {
  const [open, setOpen] = useState(true);
  const [opencodeRunning, setOpencodeRunning] = useState(false);
  const [claudeRunning, setClaudeRunning] = useState(false);

  const toggleOpencode = () => {
    if (opencodeRunning) {
      onInjectCommand('\x03');
      setOpencodeRunning(false);
    } else {
      onInjectCommand('opencode\n');
      setOpencodeRunning(true);
    }
  };

  const toggleClaude = () => {
    if (claudeRunning) {
      onInjectCommand('\x03');
      setClaudeRunning(false);
    } else {
      onInjectCommand('claude\n');
      setClaudeRunning(true);
    }
  };

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header" onClick={() => setOpen(!open)}>
        <span>🤖 AI Tools</span>
        <span className={`arrow ${open ? 'open' : ''}`}>▶</span>
      </div>
      <div className={`sidebar-section-content ${open ? 'open' : ''}`}>
        <div className="ai-tools-list">
          <div className="ai-tool-item">
            <div className="ai-tool-name">
              <span className="tool-icon">○</span>
              <span>opencode</span>
              <span className={`ai-tool-status ${opencodeRunning ? 'running' : 'stopped'}`} />
            </div>
            <button
              className={`ai-tool-btn ${opencodeRunning ? 'stop' : 'start'}`}
              onClick={toggleOpencode}
            >
              {opencodeRunning ? 'Stop' : 'Start'}
            </button>
          </div>
          <div className="ai-tool-item">
            <div className="ai-tool-name">
              <span className="tool-icon">◈</span>
              <span>claude</span>
              <span className={`ai-tool-status ${claudeRunning ? 'running' : 'stopped'}`} />
            </div>
            <button
              className={`ai-tool-btn ${claudeRunning ? 'stop' : 'start'}`}
              onClick={toggleClaude}
            >
              {claudeRunning ? 'Stop' : 'Start'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIToolsPanel;
