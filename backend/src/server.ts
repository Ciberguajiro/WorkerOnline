import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { exec, execSync } from 'child_process';
import { TerminalSession } from './terminal';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());

const WORKSPACE_DIR = '/workspace';

// Serve static frontend files
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// ─── API Endpoints ───────────────────────────────────────────────────────────

interface WorkspaceItem {
  name: string;
  path: string;
  isGitRepo: boolean;
  branch: string;
}

app.get('/api/workspaces', (_req, res) => {
  try {
    const items: WorkspaceItem[] = [];
    
    if (!fs.existsSync(WORKSPACE_DIR)) {
      res.json({ workspaces: items });
      return;
    }

    const entries = fs.readdirSync(WORKSPACE_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      
      const itemPath = path.join(WORKSPACE_DIR, entry.name);
      const isGitRepo = fs.existsSync(path.join(itemPath, '.git'));
      let branch = '';
      
      if (isGitRepo) {
        try {
          branch = execSync('git branch --show-current', { cwd: itemPath, timeout: 5000 })
            .toString().trim();
        } catch {
          branch = '';
        }
      }
      
      items.push({ name: entry.name, path: itemPath, isGitRepo, branch });
    }
    
    res.json({ workspaces: items });
  } catch (error) {
    console.error('Error listing workspaces:', error);
    res.status(500).json({ error: 'Failed to list workspaces' });
  }
});

app.post('/api/exec', (req, res) => {
  const { cmd, cwd } = req.body as { cmd?: string; cwd?: string };
  
  if (!cmd || typeof cmd !== 'string') {
    res.status(400).json({ error: 'Missing or invalid command' });
    return;
  }

  const workDir = cwd && fs.existsSync(cwd) ? cwd : WORKSPACE_DIR;

  exec(cmd, { cwd: workDir, timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    res.json({
      output: stdout + (stderr ? '\n' + stderr : ''),
      exitCode: error && 'code' in error ? (error as any).code : 0,
      error: error?.message || null,
    } as const);
  });
});

// Catch-all: serve index.html for all non-static, non-API routes (SPA support)
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ws',
  perMessageDeflate: false // Disable for better compatibility
});

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket, req) => {
  console.log('New WebSocket connection from:', req.socket.remoteAddress);
  
  try {
    const terminal = new TerminalSession(ws);
    console.log('Terminal session created successfully');
  } catch (error) {
    console.error('Failed to create terminal session:', error);
    ws.close(1011, 'Failed to create terminal');
  }
});

// Error handling for WebSocket server
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Web Terminal Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`💻 Working directory: /workspace`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
