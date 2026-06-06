import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from './auth';

const WORKSPACE_DIR = '/workspace';

interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
}

function buildTree(dirPath: string, basePath: string = ''): FileTreeItem[] {
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

export function filesRoutes(app: any) {
  // Get file tree
  app.get('/api/files/tree', (req: AuthRequest, res: Response) => {
    const { workspace } = req.query as { workspace?: string };
    
    if (!workspace) {
      res.status(400).json({ error: 'Missing workspace parameter' });
      return;
    }
    
    const targetPath = path.join(WORKSPACE_DIR, workspace);
    
    // Security: prevent path traversal
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
    } catch (error) {
      res.status(500).json({ error: 'Failed to read directory' });
    }
  });

  // Read file content
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
    
    // Check if file is binary (skip if > 1MB or contains null bytes)
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

  // Save file content
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
    
    // Ensure directory exists
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
}
