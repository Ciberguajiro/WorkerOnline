import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const Terminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
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

    // Open terminal in the container
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    
    // Connect to WebSocket
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    // Handle WebSocket open
    ws.onopen = () => {
      console.log('WebSocket connected');
      term.writeln('\r\n\x1b[32m✓ Connected to Web Terminal\x1b[0m');
      term.writeln('\x1b[33m  Working directory: /workspace\x1b[0m\r\n');
      
      // Send initial resize
      const dims = fitAddon.proposeDimensions();
      if (dims) {
        ws.send(JSON.stringify({
          type: 'resize',
          cols: dims.cols,
          rows: dims.rows,
        }));
      }
    };

    // Handle WebSocket messages (data from server)
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'data') {
          term.write(msg.data);
        }
      } catch {
        // Fallback: if not JSON, treat as raw data
        term.write(event.data);
      }
    };

    // Handle WebSocket errors
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      term.writeln('\r\n\x1b[31m✗ WebSocket error\x1b[0m');
    };

    // Handle WebSocket close
    ws.onclose = () => {
      console.log('WebSocket closed');
      term.writeln('\r\n\x1b[31m✗ Connection closed\x1b[0m');
      term.writeln('\x1b[33m  Refresh the page to reconnect\x1b[0m');
    };

    // Handle user input (send to server)
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'data', data }));
      }
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      const dims = fitAddon.proposeDimensions();
      if (dims && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'resize',
          cols: dims.cols,
          rows: dims.rows,
        }));
      }
    };

    // Use ResizeObserver for better performance
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        if (fitAddonRef.current) {
          try {
            fitAddonRef.current.fit();
            handleResize();
          } catch (e) {
            // Ignore resize errors during initialization
          }
        }
      });
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    // Also listen to window resize as fallback
    window.addEventListener('resize', handleResize);

    // Handle paste (Ctrl+Shift+V or Cmd+Shift+V)
    const handlePaste = async (e: ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text');
      if (text && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'data', data: text }));
      }
    };

    document.addEventListener('paste', handlePaste);

    // Cleanup on unmount
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('paste', handlePaste);
      ws.close();
      term.dispose();
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: '100%',
        padding: '4px',
        boxSizing: 'border-box',
      }}
    />
  );
};

export default Terminal;
