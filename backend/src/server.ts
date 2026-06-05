import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { TerminalSession } from './terminal';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Serve static frontend files
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Serve index.html for all non-static routes (SPA support)
app.get('*', (req, res) => {
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
