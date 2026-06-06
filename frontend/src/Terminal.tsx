import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface Props {
  injectedCommand?: string;
  commandId?: number;
  onCommandHandled?: () => void;
  token?: string;
  sessionId?: string;
  isActive?: boolean;
}

const Terminal: React.FC<Props> = ({ injectedCommand, commandId = 0, onCommandHandled, token, sessionId, isActive = true }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);
  const resizeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!terminalRef.current || !token) return;

    unmountedRef.current = false;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      scrollback: 10000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const connect = () => {
      if (unmountedRef.current) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const params = new URLSearchParams();
      if (token) params.set('token', token);
      if (sessionId) params.set('session', sessionId);
      const wsUrl = `${protocol}//${window.location.host}/ws?${params.toString()}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        term.write('\r\n\x1b[32m✓ Connected to Web Terminal\x1b[0m\r\n');

        const dims = fitAddon.proposeDimensions();
        if (dims) {
          ws.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'data') term.write(msg.data);
        } catch {
          term.write(event.data);
        }
      };

      ws.onerror = () => {
        term.write('\r\n\x1b[31m✗ WebSocket error\x1b[0m\r\n');
      };

      ws.onclose = () => {
        if (unmountedRef.current) return;
        const attempts = reconnectAttemptsRef.current;
        const delay = Math.min(1000 * 2 ** attempts, 30000);
        const secs = Math.round(delay / 1000);
        term.write(`\r\n\x1b[33m⟳ Reconnecting in ${secs}s... (attempt ${attempts + 1})\x1b[0m\r\n`);
        reconnectAttemptsRef.current = attempts + 1;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'data', data }));
        }
      });
    };

    connect();

    const handleResize = () => {
      if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current);
      resizeDebounceRef.current = setTimeout(() => {
        if (!fitAddonRef.current) return;
        try {
          fitAddonRef.current.fit();
          const dims = fitAddonRef.current.proposeDimensions();
          if (dims && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }));
          }
        } catch {
          // ignore resize errors during init
        }
      }, 150);
    };

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(handleResize);
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }
    window.addEventListener('resize', handleResize);

    const handlePaste = async (e: ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text');
      if (text && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'data', data: text }));
      }
    };
    document.addEventListener('paste', handlePaste);

    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('paste', handlePaste);
      wsRef.current?.close();
      term.dispose();
    };
  }, [token]);

  // Inject commands from parent — only for the active terminal tab
  useEffect(() => {
    if (!isActive || commandId === 0 || !injectedCommand) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'data', data: injectedCommand }));
      onCommandHandled?.();
    }
  }, [commandId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isActive) return;
    const ws = wsRef.current;
    if (!ws || commandId === 0 || !injectedCommand) return;

    const onOpen = () => {
      ws.send(JSON.stringify({ type: 'data', data: injectedCommand }));
      onCommandHandled?.();
    };

    ws.addEventListener('open', onOpen);
    return () => ws.removeEventListener('open', onOpen);
  }, [commandId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        flex: 1,
        padding: '2px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    />
  );
};

export default Terminal;
