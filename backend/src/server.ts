import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { exec, execSync } from 'child_process';
import { TerminalSession } from './terminal';
import { authRoutes, requireAuth, verifyToken } from './auth';
import { filesRoutes } from './files';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;
const WS_TIMEOUT_MS = parseInt(process.env.WS_TIMEOUT_MS || '900000', 10); // 15 min default

app.use(express.json());

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

const WORKSPACE_DIR = '/workspace';

// ─── Environment Validation ───────────────────────────────────────────────────
const requiredEnv = ['NODE_ENV'];
const optionalEnv = ['GITHUB_TOKEN', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'PORT', 'JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];

function validateEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`⚠️ Missing required env vars: ${missing.join(', ')}`);
  }
  const set = optionalEnv.filter((key) => process.env[key]);
  console.log(`🔧 Environment: ${set.length}/${optionalEnv.length} optional vars set`);
}

validateEnv();

// ─── Structured Logging ───────────────────────────────────────────────────────
function log(level: string, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const requestId = meta?.requestId || 'system';
  const extra = meta ? JSON.stringify(meta) : '';
  console.log(`[${timestamp}] [${level}] [${requestId}] ${message} ${extra}`);
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), version: '0.1.12' });
});

// ─── Request ID Middleware ──────────────────────────────────────────────────────
app.use((req, res, next) => {
  (req as any).requestId = Math.random().toString(36).substring(2, 15);
  next();
});

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

app.get('/api/workspaces', requireAuth, (_req, res) => {
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

app.post('/api/exec', requireAuth, (req, res) => {
  const { cmd, cwd } = req.body as { cmd?: string; cwd?: string };
  const requestId = (req as any).requestId;

  if (!cmd || typeof cmd !== 'string' || cmd.length > 4096) {
    log('warn', 'Invalid exec request', { requestId, reason: !cmd ? 'missing' : 'invalid' });
    res.status(400).json({ error: 'Missing or invalid command' });
    return;
  }

  // Basic command safety: block dangerous characters
  const blocked = [';', '&&', '||', '|', '`', '$', '>', '<'];
  const hasBlocked = blocked.some((c) => cmd.includes(c));
  if (hasBlocked) {
    log('warn', 'Blocked command characters detected', { requestId, cmd: cmd.substring(0, 50) });
    res.status(400).json({ error: 'Command contains blocked characters' });
    return;
  }

  const workDir = cwd && fs.existsSync(cwd) ? cwd : WORKSPACE_DIR;

  log('info', `Executing command`, { requestId, cmd: cmd.substring(0, 50) });

  exec(cmd, { cwd: workDir, timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    log('info', `Command finished`, { requestId, exitCode: error ? (error as any).code || 1 : 0 });
    res.json({
      output: stdout + (stderr ? '\n' + stderr : ''),
      exitCode: error && 'code' in error ? (error as any).code : 0,
      error: error?.message || null,
    } as const);
  });
});

// ─── Sessions (tmux) API ──────────────────────────────────────────────────────

app.get('/api/sessions', requireAuth, (_req, res) => {
  exec(
    "tmux list-sessions -F '#{session_name}|#{session_created}|#{session_attached}' 2>/dev/null",
    { timeout: 5000 },
    (error, stdout) => {
      if (error || !stdout.trim()) {
        res.json({ sessions: [] });
        return;
      }
      const sessions = stdout.trim().split('\n')
        .map((line) => {
          const [name, created, attached] = line.split('|');
          return {
            name,
            createdAt: parseInt(created, 10) * 1000,
            attached: attached?.trim() === '1',
          };
        })
        .filter((s) => s.name?.startsWith('wt-'));
      res.json({ sessions });
    }
  );
});

app.delete('/api/sessions/:name', requireAuth, (req, res) => {
  const { name } = req.params;
  if (!name || !name.startsWith('wt-') || !/^wt-[a-z0-9]+$/i.test(name)) {
    res.status(400).json({ error: 'Invalid session name' });
    return;
  }
  exec(`tmux kill-session -t "${name}" 2>/dev/null`, { timeout: 5000 }, (error) => {
    if (error) {
      res.status(404).json({ error: 'Session not found or already closed' });
      return;
    }
    res.json({ success: true });
  });
});

// ─── Auth Routes ──────────────────────────────────────────────────────────────
authRoutes(app);

// ─── Files Routes ─────────────────────────────────────────────────────────────
filesRoutes(app);

// Catch-all: serve index.html for all non-static, non-API routes (SPA support)
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Create WebSocket server
const wss = new WebSocketServer({
  server,
  path: '/ws',
  perMessageDeflate: true, // Enable for better compression
});

// Track active sessions for graceful shutdown
const activeSessions = new Set<WebSocket>();

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket, req) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  const clientIp = req.socket.remoteAddress;

  // Verify token from query param
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    log('warn', 'WebSocket connection rejected - no token', { requestId, clientIp });
    ws.close(1008, 'Authentication required');
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    log('warn', 'WebSocket connection rejected - invalid token', { requestId, clientIp });
    ws.close(1008, 'Invalid token');
    return;
  }

  activeSessions.add(ws);
  log('info', 'New WebSocket connection', { requestId, clientIp, user: decoded.username });

  // Inactivity timeout
  let lastActivity = Date.now();
  const activityInterval = setInterval(() => {
    if (Date.now() - lastActivity > WS_TIMEOUT_MS) {
      log('info', 'WebSocket timed out due to inactivity', { requestId });
      ws.close(1001, 'Inactivity timeout');
      clearInterval(activityInterval);
    }
  }, 60000);

  ws.on('message', () => {
    lastActivity = Date.now();
  });

  ws.on('close', () => {
    activeSessions.delete(ws);
    clearInterval(activityInterval);
    log('info', 'WebSocket connection closed', { requestId });
  });

  ws.on('error', (error) => {
    log('error', 'WebSocket error', { requestId, error: (error as Error).message });
  });

  const sessionName = url.searchParams.get('session') || undefined;

  try {
    const terminal = new TerminalSession(ws, sessionName);
    log('info', 'Terminal session created successfully', { requestId, session: sessionName ?? 'none' });
  } catch (error) {
    log('error', 'Failed to create terminal session', { requestId, error: (error as Error).message });
    ws.close(1011, 'Failed to create terminal');
  }
});

// Error handling for WebSocket server
wss.on('error', (error) => {
  log('error', 'WebSocket server error', { error: error.message });
});

// Start server
server.listen(PORT, () => {
  log('info', `🚀 Web Terminal Server running on http://localhost:${PORT}`);
  log('info', `📡 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  log('info', `💻 Working directory: /workspace`);
});

// Graceful shutdown
function gracefulShutdown(signal: string) {
  log('info', `${signal} received, shutting down gracefully`);
  log('info', `Closing ${activeSessions.size} active WebSocket connections`);

  for (const ws of activeSessions) {
    ws.close(1001, 'Server shutting down');
  }
  activeSessions.clear();

  server.close(() => {
    log('info', 'Server closed');
    process.exit(0);
  });

  // Force exit after 10s
  setTimeout(() => {
    log('error', 'Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
