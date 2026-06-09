import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SessionRestoreData,
  WorkspacesListResponse,
  FileOpenResponse,
  FileSaveResponse,
  FileTreeItem,
  ExecResult,
} from '../../../types/socket-events';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
  socket: TypedSocket | null;
  isConnected: boolean;
  sessionId: string | null;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  sessionId: null,
});

// eslint-disable-next-line react-refresh/only-export-components
export function useSocketContext() {
  return useContext(SocketContext);
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token, logout } = useAuth();
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(
    () => localStorage.getItem('webterminal-session-id')
  );

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const sessionIdFromStorage = localStorage.getItem('webterminal-session-id');

    const socket: TypedSocket = io({
      auth: {
        token,
        ...(sessionIdFromStorage ? { sessionId: sessionIdFromStorage } : {}),
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      if (err.message === 'Invalid token' || err.message === 'Authentication required') {
        logout();
      }
    });

    socket.on('session:created', (data: { sessionId: string }) => {
      setSessionId(data.sessionId);
      localStorage.setItem('webterminal-session-id', data.sessionId);
    });

    socket.on('session:restored', (_data: SessionRestoreData) => {
      // State restoration is handled by individual components listening to this event
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, token, logout]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, sessionId }}>
      {children}
    </SocketContext.Provider>
  );
};

// ─── Convenience hook with typed methods ─────────────────────────────────────

export interface UseSocketReturn {
  socket: TypedSocket | null;
  isConnected: boolean;
  sessionId: string | null;
  listWorkspaces: () => Promise<WorkspacesListResponse>;
  selectWorkspace: (workspacePath: string) => void;
  getFileTree: (workspacePath: string) => void;
  openFile: (filePath: string) => Promise<FileOpenResponse>;
  saveFile: (filePath: string, content: string) => Promise<FileSaveResponse>;
  execCommand: (cmd: string, cwd?: string) => void;
  gitStatus: (cwd: string) => void;
  gitPull: (cwd: string) => void;
  gitPush: (cwd: string) => void;
  terminalInput: (data: string) => void;
  terminalResize: (cols: number, rows: number) => void;
  terminalConnect: (cwd?: string) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket(): UseSocketReturn {
  const { socket, isConnected, sessionId } = useSocketContext();

  const listWorkspaces = useCallback(() => {
    return new Promise<WorkspacesListResponse>((resolve) => {
      if (!socket) {
        resolve({ workspaces: [] });
        return;
      }
      socket.emit('workspaces:list', resolve);
    });
  }, [socket]);

  const selectWorkspace = useCallback((workspacePath: string) => {
    socket?.emit('workspace:select', { workspacePath });
  }, [socket]);

  const getFileTree = useCallback((workspacePath: string) => {
    socket?.emit('file-tree:get', { workspacePath });
  }, [socket]);

  const openFile = useCallback((filePath: string) => {
    return new Promise<FileOpenResponse>((resolve) => {
      if (!socket) {
        resolve({ content: '', path: '' });
        return;
      }
      socket.emit('file:open', { filePath }, resolve);
    });
  }, [socket]);

  const saveFile = useCallback((filePath: string, content: string) => {
    return new Promise<FileSaveResponse>((resolve) => {
      if (!socket) {
        resolve({ ok: false, error: 'No connection' });
        return;
      }
      socket.emit('file:save', { filePath, content }, resolve);
    });
  }, [socket]);

  const execCommand = useCallback((cmd: string, cwd?: string) => {
    socket?.emit('exec:command', { cmd, cwd });
  }, [socket]);

  const gitStatus = useCallback((cwd: string) => {
    socket?.emit('git:status', { cwd });
  }, [socket]);

  const gitPull = useCallback((cwd: string) => {
    socket?.emit('git:pull', { cwd });
  }, [socket]);

  const gitPush = useCallback((cwd: string) => {
    socket?.emit('git:push', { cwd });
  }, [socket]);

  const terminalInput = useCallback((data: string) => {
    socket?.emit('terminal:input', { data });
  }, [socket]);

  const terminalResize = useCallback((cols: number, rows: number) => {
    socket?.emit('terminal:resize', { cols, rows });
  }, [socket]);

  const terminalConnect = useCallback((cwd?: string) => {
    socket?.emit('terminal:connect', { cwd });
  }, [socket]);

  return {
    socket,
    isConnected,
    sessionId,
    listWorkspaces,
    selectWorkspace,
    getFileTree,
    openFile,
    saveFile,
    execCommand,
    gitStatus,
    gitPull,
    gitPush,
    terminalInput,
    terminalResize,
    terminalConnect,
  };
}

export type { FileTreeItem, ExecResult, SessionRestoreData };
