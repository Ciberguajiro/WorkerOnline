import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { exec, execSync } from 'child_process';
import { verifyToken } from './auth';
import { TerminalSession } from './terminal';
import { buildTree } from './files';
interface WorkspaceItem {
  name: string;
  path: string;
  isGitRepo: boolean;
  branch: string;
}

interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
}

interface ExecResult {
  output: string;
  exitCode: number;
  error: string | null;
}

interface WorkspacesListResponse {
  workspaces: WorkspaceItem[];
}

interface FileOpenResponse {
  content: string;
  path: string;
}

interface FileSaveResponse {
  ok: boolean;
  error?: string;
}

interface SessionRestoreData {
  sessionId: string;
  currentWorkspace: string;
  openTabs: string[];
  fileContents: Record<string, string>;
}

interface ServerToClientEvents {
  'workspaces:list': (data: WorkspacesListResponse) => void;
  'workspace:selected': (data: { workspacePath: string }) => void;
  'file-tree:update': (data: { tree: FileTreeItem[] }) => void;
  'file:opened': (data: FileOpenResponse) => void;
  'file:saved': (data: FileSaveResponse) => void;
  'git:output': (data: { stdout: string; stderr: string }) => void;
  'exec:output': (data: ExecResult) => void;
  'terminal:output': (data: string) => void;
  'session:created': (data: { sessionId: string }) => void;
  'session:restored': (data: SessionRestoreData) => void;
}

interface ClientToServerEvents {
  'workspaces:list': (callback: (res: WorkspacesListResponse) => void) => void;
  'workspace:select': (data: { workspacePath: string }) => void;
  'file-tree:get': (data: { workspacePath: string }) => void;
  'file:open': (data: { filePath: string }, callback: (res: FileOpenResponse) => void) => void;
  'file:save': (data: { filePath: string; content: string }, callback: (res: FileSaveResponse) => void) => void;
  'git:status': (data: { cwd: string }) => void;
  'git:pull': (data: { cwd: string }) => void;
  'git:push': (data: { cwd: string }) => void;
  'exec:command': (data: { cmd: string; cwd?: string }) => void;
  'terminal:input': (data: { data: string }) => void;
  'terminal:resize': (data: { cols: number; rows: number }) => void;
  'terminal:connect': (data?: { cwd?: string }) => void;
}

const WORKSPACE_DIR = '/workspace';
const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes after disconnect
const RATE_LIMIT_MAX = 30; // events per second

function validatePath(userPath: string, base: string = WORKSPACE_DIR): string | null {
  const resolved = path.resolve(path.join(base, userPath));
  if (!resolved.startsWith(base)) return null;
  return resolved;
}

function getLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript',
    '.json': 'json', '.md': 'markdown', '.py': 'python', '.css': 'css', '.html': 'html',
    '.yml': 'yaml', '.yaml': 'yaml', '.sh': 'bash', '.txt': 'text',
  };
  return map[ext] || 'text';
}

function listWorkspaces(): WorkspaceItem[] {
  const items: WorkspaceItem[] = [];
  if (!fs.existsSync(WORKSPACE_DIR)) return items;

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
      } catch { branch = ''; }
    }
    items.push({ name: entry.name, path: itemPath, isGitRepo, branch });
  }
  return items;
}

interface SessionState {
  userId: string;
  currentWorkspace: string;
  openTabs: string[];
  fileContentsCache: Map<string, string>;
  terminal: TerminalSession | null;
  createdAt: number;
  lastActivity: number;
  disconnectedAt: number | null;
  cleanupTimer: ReturnType<typeof setTimeout> | null;
  socketId: string | null;
}

const sessions = new Map<string, SessionState>();

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function initializeSocket(server: HttpServer): Server {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    perMessageDeflate: true,
    pingInterval: 25000,
    pingTimeout: 20000,
    connectTimeout: 10000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Invalid token'));
    }
    (socket as any).user = decoded;
    next();
  });

  // Rate limiting middleware
  io.use((socket, next) => {
    let count = 0;
    const resetInterval = setInterval(() => { count = 0; }, 1000);
    (socket as any).__rateCheck = () => {
      count++;
      if (count > RATE_LIMIT_MAX) {
        return false;
      }
      return true;
    };
    socket.on('disconnect', () => clearInterval(resetInterval));
    next();
  });

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    const user = (socket as any).user as { username: string };
    const clientIp = socket.handshake.address;
    const requestId = Math.random().toString(36).substring(2, 15);

    console.log(`[${new Date().toISOString()}] [info] [${requestId}] Socket connected user=${user.username} ip=${clientIp}`);

    // Session management
    const incomingSessionId = socket.handshake.auth.sessionId as string | undefined;
    let session: SessionState;

    if (incomingSessionId && sessions.has(incomingSessionId)) {
      const existing = sessions.get(incomingSessionId)!;
      if (existing.disconnectedAt && (Date.now() - existing.disconnectedAt < SESSION_TTL_MS)) {
        session = existing;
        if (session.cleanupTimer) {
          clearTimeout(session.cleanupTimer);
          session.cleanupTimer = null;
        }
        session.disconnectedAt = null;
        session.lastActivity = Date.now();
        session.socketId = socket.id;

        console.log(`[${new Date().toISOString()}] [info] [${requestId}] Session restored sessionId=${incomingSessionId}`);

        // Restore state to client
        const restoreData: SessionRestoreData = {
          sessionId: incomingSessionId,
          currentWorkspace: session.currentWorkspace,
          openTabs: session.openTabs,
          fileContents: {},
        };
        for (const tab of session.openTabs) {
          if (session.fileContentsCache.has(tab)) {
            restoreData.fileContents[tab] = session.fileContentsCache.get(tab)!;
          }
        }
        socket.emit('session:restored', restoreData);
        console.log(`[${new Date().toISOString()}] [info] [${requestId}] Session restored sent tabs=${session.openTabs.length}`);
        return;
      }
      // Session expired, remove it
      sessions.delete(incomingSessionId);
    }

    // Create new session
    const newSessionId = generateSessionId();
    session = {
      userId: user.username,
      currentWorkspace: '',
      openTabs: [],
      fileContentsCache: new Map(),
      terminal: null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      disconnectedAt: null,
      cleanupTimer: null,
      socketId: socket.id,
    };
    sessions.set(newSessionId, session);

    socket.emit('session:created', { sessionId: newSessionId });
    console.log(`[${new Date().toISOString()}] [info] [${requestId}] New session created sessionId=${newSessionId}`);

    // ─── Event Handlers ───────────────────────────────────────────────────────

    socket.on('workspaces:list', (callback) => {
      const workspaces = listWorkspaces();
      callback({ workspaces });
    });

    socket.on('workspace:select', (data) => {
      if (!data || !data.workspacePath) return;
      const targetPath = validatePath(data.workspacePath);
      if (!targetPath) return;

      session.currentWorkspace = data.workspacePath;
      session.lastActivity = Date.now();
      socket.emit('workspace:selected', { workspacePath: data.workspacePath });

      const tree = buildTree(targetPath);
      socket.emit('file-tree:update', { tree });
    });

    socket.on('file-tree:get', (data) => {
      if (!data || !data.workspacePath) return;
      const targetPath = validatePath(data.workspacePath);
      if (!targetPath) return;

      const tree = buildTree(targetPath);
      socket.emit('file-tree:update', { tree });
    });

    socket.on('file:open', (data, callback) => {
      if (!data || !data.filePath) {
        callback({ content: '', path: '' });
        return;
      }
      const targetPath = validatePath(data.filePath);
      if (!targetPath) {
        callback({ content: '', path: '' });
        return;
      }
      if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
        callback({ content: '', path: '' });
        return;
      }
      const stats = fs.statSync(targetPath);
      if (stats.size > 1024 * 1024) {
        callback({ content: '', path: '' });
        return;
      }
      try {
        const content = fs.readFileSync(targetPath, 'utf-8');
        session.fileContentsCache.set(data.filePath, content);
        if (!session.openTabs.includes(data.filePath)) {
          session.openTabs.push(data.filePath);
        }
        session.lastActivity = Date.now();
        callback({ content, path: data.filePath });
      } catch {
        callback({ content: '', path: '' });
      }
    });

    socket.on('file:save', (data, callback) => {
      if (!data || !data.filePath || data.content === undefined) {
        callback({ ok: false, error: 'Missing path or content' });
        return;
      }
      const targetPath = validatePath(data.filePath);
      if (!targetPath) {
        callback({ ok: false, error: 'Forbidden' });
        return;
      }
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      try {
        fs.writeFileSync(targetPath, data.content, 'utf-8');
        session.fileContentsCache.set(data.filePath, data.content);
        session.lastActivity = Date.now();
        callback({ ok: true });
      } catch (e: any) {
        callback({ ok: false, error: e.message });
      }
    });

    socket.on('git:status', (data) => {
      if (!data || !data.cwd) return;
      const targetPath = validatePath(data.cwd);
      if (!targetPath) return;
      exec('git status --short', { cwd: targetPath, timeout: 30000 }, (error, stdout, stderr) => {
        socket.emit('git:output', { stdout, stderr });
        session.lastActivity = Date.now();
      });
    });

    socket.on('git:pull', (data) => {
      if (!data || !data.cwd) return;
      const targetPath = validatePath(data.cwd);
      if (!targetPath) return;
      exec('git pull', { cwd: targetPath, timeout: 60000 }, (error, stdout, stderr) => {
        socket.emit('git:output', { stdout, stderr });
        session.lastActivity = Date.now();
      });
    });

    socket.on('git:push', (data) => {
      if (!data || !data.cwd) return;
      const targetPath = validatePath(data.cwd);
      if (!targetPath) return;
      exec('git push', { cwd: targetPath, timeout: 60000 }, (error, stdout, stderr) => {
        socket.emit('git:output', { stdout, stderr });
        session.lastActivity = Date.now();
      });
    });

    socket.on('exec:command', (data) => {
      if (!data || !data.cmd || typeof data.cmd !== 'string' || data.cmd.length > 4096) {
        socket.emit('exec:output', { output: '', exitCode: 1, error: 'Invalid command' });
        return;
      }
      const blocked = [';', '&&', '||', '|', '`', '$', '>', '<'];
      const hasBlocked = blocked.some((c) => data.cmd.includes(c));
      if (hasBlocked) {
        socket.emit('exec:output', { output: '', exitCode: 1, error: 'Command contains blocked characters' });
        return;
      }
      const workDir = data.cwd && validatePath(data.cwd) || WORKSPACE_DIR;
      exec(data.cmd, { cwd: workDir, timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        socket.emit('exec:output', {
          output: stdout + (stderr ? '\n' + stderr : ''),
          exitCode: error && 'code' in error ? (error as any).code : 0,
          error: error?.message || null,
        });
        session.lastActivity = Date.now();
      });
    });

    socket.on('terminal:connect', (data) => {
      const cwd = data?.cwd && validatePath(data.cwd) || WORKSPACE_DIR;
      if (session.terminal) {
        session.terminal.kill();
      }
      try {
        session.terminal = new TerminalSession(
          (outputData) => {
            socket.volatile.emit('terminal:output', outputData);
          },
          (exitCode, signal) => {
            socket.volatile.emit('terminal:output', `\r\nProcess exited with code ${exitCode}\r\n`);
          },
          cwd
        );
      } catch (e: any) {
        console.error('Failed to create terminal:', e.message);
      }
    });

    socket.on('terminal:input', (data) => {
      if (data && data.data && session.terminal) {
        session.terminal.write(data.data);
        session.lastActivity = Date.now();
      }
    });

    socket.on('terminal:resize', (data) => {
      if (data && session.terminal) {
        session.terminal.resize(data.cols, data.rows);
      }
    });

    // ─── Disconnect Handler ────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[${new Date().toISOString()}] [info] [${requestId}] Socket disconnected user=${user.username}`);
      session.disconnectedAt = Date.now();
      session.socketId = null;

      if (session.terminal) {
        session.terminal.kill();
        session.terminal = null;
      }

      session.cleanupTimer = setTimeout(() => {
        const sid = [...sessions.entries()].find(([, s]) => s === session)?.[0];
        if (sid) {
          sessions.delete(sid);
          console.log(`[${new Date().toISOString()}] [info] [system] Session cleaned up sessionId=${sid}`);
        }
      }, SESSION_TTL_MS);
    });
  });

  // Periodic cleanup of expired sessions
  setInterval(() => {
    const now = Date.now();
    for (const [id, s] of sessions) {
      if (s.disconnectedAt && (now - s.disconnectedAt > SESSION_TTL_MS)) {
        sessions.delete(id);
      }
    }
  }, 60000);

  return io;
}
