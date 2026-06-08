import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from './auth';

const WORKSPACE_DIR = '/workspace';

export interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
}

export function buildTree(dirPath: string, basePath: string = ''): FileTreeItem[] {
  const items: FileTreeItem[] = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.git') continue;

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        const children = buildTree(fullPath, relativePath);
        items.push({ name: entry.name, path: relativePath, type: 'directory', children });
      } else {
        items.push({ name: entry.name, path: relativePath, type: 'file' });
      }
    }
  } catch {
    // Directory not readable, skip
  }

  return items.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'directory' ? -1 : 1;
  });
}

export function validateFilePath(userPath: string): string | null {
  const resolved = path.resolve(path.join(WORKSPACE_DIR, userPath));
  if (!resolved.startsWith(WORKSPACE_DIR)) return null;
  return resolved;
}

export function filesRoutes(app: any) {
  app.get('/api/files/tree', (req: AuthRequest, res: Response) => {
    const { workspace } = req.query as { workspace?: string };

    if (!workspace) {
      res.status(400).json({ error: 'Missing workspace parameter' });
      return;
    }

    const targetPath = path.join(WORKSPACE_DIR, workspace);

    if (!targetPath.startsWith(WORKSPACE_DIR)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (!fs.existsSync(targetPath)) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    try {
      const tree = buildTree(targetPath);
      res.json({ tree });
    } catch {
      res.status(500).json({ error: 'Failed to read directory' });
    }
  });

  app.get('/api/files', (req: AuthRequest, res: Response) => {
    const { path: filePath } = req.query as { path?: string };

    if (!filePath) {
      res.status(400).json({ error: 'Missing path parameter' });
      return;
    }

    const targetPath = path.join(WORKSPACE_DIR, filePath);

    if (!targetPath.startsWith(WORKSPACE_DIR)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (!fs.existsSync(targetPath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    if (fs.statSync(targetPath).isDirectory()) {
      res.status(400).json({ error: 'Path is a directory' });
      return;
    }

    const stats = fs.statSync(targetPath);
    if (stats.size > 1024 * 1024) {
      res.status(400).json({ error: 'File too large (>1MB)' });
      return;
    }

    try {
      const content = fs.readFileSync(targetPath, 'utf-8');
      res.json({ content, path: filePath });
    } catch {
      res.status(500).json({ error: 'Failed to read file' });
    }
  });

  app.post('/api/files', (req: AuthRequest, res: Response) => {
    const { path: filePath, content } = req.body as { path?: string; content?: string };

    if (!filePath || content === undefined) {
      res.status(400).json({ error: 'Missing path or content' });
      return;
    }

    const targetPath = path.join(WORKSPACE_DIR, filePath);

    if (!targetPath.startsWith(WORKSPACE_DIR)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      fs.writeFileSync(targetPath, content, 'utf-8');
      res.json({ success: true, path: filePath });
    } catch {
      res.status(500).json({ error: 'Failed to write file' });
    }
  });

  // Create directory
  app.post('/api/files/mkdir', (req: AuthRequest, res: Response) => {
    const { path: dirPath } = req.body as { path?: string };

    if (!dirPath) {
      res.status(400).json({ error: 'Missing path' });
      return;
    }

    const targetPath = path.join(WORKSPACE_DIR, dirPath);
    if (!targetPath.startsWith(WORKSPACE_DIR)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    try {
      fs.mkdirSync(targetPath, { recursive: true });
      res.json({ success: true, path: dirPath });
    } catch {
      res.status(500).json({ error: 'Failed to create directory' });
    }
  });

  // Rename / move file or directory
  app.patch('/api/files/rename', (req: AuthRequest, res: Response) => {
    const { from, to } = req.body as { from?: string; to?: string };

    if (!from || !to) {
      res.status(400).json({ error: 'Missing from or to' });
      return;
    }

    const fromPath = path.join(WORKSPACE_DIR, from);
    const toPath = path.join(WORKSPACE_DIR, to);

    if (!fromPath.startsWith(WORKSPACE_DIR) || !toPath.startsWith(WORKSPACE_DIR)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (!fs.existsSync(fromPath)) {
      res.status(404).json({ error: 'Source not found' });
      return;
    }

    // Ensure destination parent exists
    fs.mkdirSync(path.dirname(toPath), { recursive: true });

    try {
      fs.renameSync(fromPath, toPath);
      res.json({ success: true, from, to });
    } catch {
      res.status(500).json({ error: 'Failed to rename' });
    }
  });

  // Delete file or directory
  app.delete('/api/files', (req: AuthRequest, res: Response) => {
    const { path: filePath } = req.body as { path?: string };

    if (!filePath) {
      res.status(400).json({ error: 'Missing path' });
      return;
    }

    const targetPath = path.join(WORKSPACE_DIR, filePath);
    if (!targetPath.startsWith(WORKSPACE_DIR)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (!fs.existsSync(targetPath)) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    try {
      fs.rmSync(targetPath, { recursive: true, force: true });
      res.json({ success: true, path: filePath });
    } catch {
      res.status(500).json({ error: 'Failed to delete' });
    }
  });
}
