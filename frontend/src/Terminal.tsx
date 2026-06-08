import React, { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useSocket } from './contexts/SocketContext';
import 'xterm/css/xterm.css';

interface Props {
  injectedCommand?: string;
  commandId?: number;
  onCommandHandled?: () => void;
}

const Terminal: React.FC<Props> = ({ injectedCommand, commandId = 0, onCommandHandled }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { socket, isConnected, terminalInput, terminalResize, terminalConnect } = useSocket();
  const terminalReadyRef = useRef(false);

  const sendData = useCallback((data: string) => {
    terminalInput(data);
  }, [terminalInput]);

  useEffect(() => {
    if (!terminalRef.current) return;

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

    term.onData((data) => {
      sendData(data);
    });

    return () => {
      term.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Connect terminal via socket when socket becomes available
  useEffect(() => {
    if (!socket) return;
    terminalConnect();
    terminalReadyRef.current = true;

    const outputHandler = (data: string) => {
      xtermRef.current?.write(data);
    };

    socket.on('terminal:output', outputHandler);

    const onReconnect = () => {
      terminalConnect();
      if (xtermRef.current) {
        xtermRef.current.write('\r\n\x1b[32m✓ Reconnected\x1b[0m\r\n');
      }
    };
    socket.io.on('reconnect', onReconnect);

    return () => {
      socket.off('terminal:output', outputHandler);
      socket.io.off('reconnect', onReconnect);
    };
  }, [socket, terminalConnect]);

  // Handle connection status display
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;
    if (isConnected && terminalReadyRef.current) {
      term.write('\r\n\x1b[32m✓ Connected to terminal\x1b[0m\r\n');
    }
  }, [isConnected]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const fit = fitAddonRef.current;
      if (!fit) return;
      try {
        fit.fit();
        const dims = fit.proposeDimensions();
        if (dims) {
          terminalResize(dims.cols, dims.rows);
        }
      } catch {
        // Ignore resize errors during initialization
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        handleResize();
      });
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [terminalResize]);

  // Handle paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text');
      if (text) {
        sendData(text);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [sendData]);

  // Inject commands from parent
  useEffect(() => {
    if (commandId > 0 && injectedCommand) {
      sendData(injectedCommand);
      onCommandHandled?.();
    }
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
