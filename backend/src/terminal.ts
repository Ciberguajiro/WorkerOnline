import * as pty from 'node-pty';

export class TerminalSession {
  private ptyProcess: pty.IPty;
  private onDataCallback: ((data: string) => void) | null = null;
  private onExitCallback: ((exitCode: number, signal: number | undefined) => void) | null = null;

  constructor(
    onData: (data: string) => void,
    onExit: (exitCode: number, signal: number | undefined) => void,
    cwd: string = '/workspace'
  ) {
    this.onDataCallback = onData;
    this.onExitCallback = onExit;

    this.ptyProcess = pty.spawn('/bin/bash', [], {
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
      if (this.onDataCallback) {
        this.onDataCallback(data);
      }
    });

    this.ptyProcess.onExit(({ exitCode, signal }) => {
      console.log(`PTY process exited with code ${exitCode} and signal ${signal}`);
      if (this.onExitCallback) {
        this.onExitCallback(exitCode, signal);
      }
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
