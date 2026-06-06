import * as pty from 'node-pty';
import { WebSocket } from 'ws';

export class TerminalSession {
  private ptyProcess: pty.IPty;
  private ws: WebSocket;

  constructor(ws: WebSocket, sessionName?: string, cwd: string = '/workspace') {
    this.ws = ws;

    // Use tmux for persistent sessions when a session name is provided.
    // Killing the tmux client (node-pty) detaches from the session but keeps
    // the tmux session (and any running AI tool) alive in the background.
    const cmd = sessionName ? 'tmux' : '/bin/bash';
    const args = sessionName ? ['new-session', '-A', '-s', sessionName] : [];

    this.ptyProcess = pty.spawn(cmd, args, {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        SHELL: '/bin/bash',
        PATH: `/root/.npm-global/bin:${process.env.HOME || '/root'}/.opencode/bin:${process.env.PATH || ''}`,
      } as { [key: string]: string },
    });

    this.ptyProcess.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'data', data }));
      }
    });

    this.ptyProcess.onExit(({ exitCode, signal }) => {
      console.log(`PTY process exited with code ${exitCode} and signal ${signal}`);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'data',
          data: `\r\nProcess exited with code ${exitCode}\r\n`,
        }));
        ws.close();
      }
    });

    ws.on('message', (message: Buffer) => {
      try {
        const msg = JSON.parse(message.toString());
        switch (msg.type) {
          case 'data':
            this.ptyProcess.write(msg.data);
            break;
          case 'resize':
            if (msg.cols && msg.rows) {
              this.ptyProcess.resize(msg.cols, msg.rows);
            }
            break;
          default:
            console.warn('Unknown message type:', msg.type);
        }
      } catch {
        const data = message.toString();
        if (data.startsWith('resize:')) {
          const [, cols, rows] = data.split(':');
          this.ptyProcess.resize(parseInt(cols), parseInt(rows));
        } else {
          this.ptyProcess.write(data);
        }
      }
    });

    ws.on('close', () => {
      // Killing node-pty detaches the tmux CLIENT but leaves the tmux SESSION
      // running — claude/opencode keep working in the background.
      console.log(`WebSocket closed, detaching session: ${sessionName ?? 'none'}`);
      this.ptyProcess.kill();
    });

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
