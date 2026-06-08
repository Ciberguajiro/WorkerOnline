export interface WorkspaceItem {
  name: string;
  path: string;
  isGitRepo: boolean;
  branch: string;
}

export interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
}

export interface ExecResult {
  output: string;
  exitCode: number;
  error: string | null;
}

export interface WorkspacesListResponse {
  workspaces: WorkspaceItem[];
}

export interface FileOpenResponse {
  content: string;
  path: string;
}

export interface FileSaveResponse {
  ok: boolean;
  error?: string;
}

export interface SessionRestoreData {
  sessionId: string;
  currentWorkspace: string;
  openTabs: string[];
  fileContents: Record<string, string>;
}

export interface ServerToClientEvents {
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

export interface ClientToServerEvents {
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
