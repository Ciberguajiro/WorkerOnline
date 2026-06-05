import * as pty from 'node-pty';
import { WebSocket } from 'ws';

export class TerminalSession {
  private ptyProcess: pty.IPty;
  private ws: WebSocket;

  constructor(ws: WebSocket, cwd: string = '/workspace') {
    this.ws = ws;
    
    // Spawn bash shell with PTY
    this.ptyProcess = pty.spawn('/bin/bash', [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        SHELL: '/bin/bash',
      } as { [key: string]: string },
    });

    // Handle data from PTY process
    this.ptyProcess.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'data', data }));
      }
    });

    // Handle PTY process exit
    this.ptyProcess.onExit(({ exitCode, signal }) => {
      console.log(`PTY process exited with code ${exitCode} and signal ${signal}`);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'data', 
          data: `\r\nProcess exited with code ${exitCode}\r\n` 
        }));
        ws.close();
      }
    });

    // Handle WebSocket messages
    ws.on('message', (message: Buffer) => {
      try {
        const msg = JSON.parse(message.toString());
        
        switch (msg.type) {
          case 'data':
            // Write data to PTY (user input)
            this.ptyProcess.write(msg.data);
            break;
          case 'resize':
            // Resize PTY
            if (msg.cols && msg.rows) {
              this.ptyProcess.resize(msg.cols, msg.rows);
            }
            break;
          default:
            console.warn('Unknown message type:', msg.type);
        }
      } catch (error) {
        // If not JSON, treat as raw data (fallback for simple clients)
        const data = message.toString();
        if (data.startsWith('resize:')) {
          const [, cols, rows] = data.split(':');
          this.ptyProcess.resize(parseInt(cols), parseInt(rows));
        } else {
          this.ptyProcess.write(data);
        }
      }
    });

    // Handle WebSocket close
    ws.on('close', () => {
      console.log('WebSocket closed, killing PTY process');
      this.ptyProcess.kill();
    });

    // Handle WebSocket errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.ptyProcess.kill();
    });
  }

  public resize(cols: number, rows: number): void {
    this.ptyProcess.resize(cols, rows);
  }

  public write(data: string): void {
    this.ptyProcess.write(data);
  }

  public kill(): void {
    this.ptyProcess.kill();
  }
}
