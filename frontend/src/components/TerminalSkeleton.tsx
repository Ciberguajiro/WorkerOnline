import React from 'react';

const TerminalSkeleton: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.dot} />
        <div style={styles.dot} />
        <div style={styles.dot} />
      </div>
      <div style={styles.body}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={styles.line}>
            <div style={{ ...styles.text, width: `${Math.random() * 60 + 30}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e1e1e',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    height: '32px',
    backgroundColor: '#2d2d2d',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    gap: '8px',
    borderBottom: '1px solid #3e3e3e',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#3e3e3e',
  },
  body: {
    flex: 1,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  line: {
    display: 'flex',
    alignItems: 'center',
  },
  text: {
    height: '14px',
    backgroundColor: '#2d2d2d',
    borderRadius: '4px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
};

export default TerminalSkeleton;
