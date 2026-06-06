import React from 'react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      style={styles.button}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
};

const styles: Record<string, React.CSSProperties> = {
  button: {
    background: 'transparent',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'background 0.2s',
  },
};

export default ThemeToggle;
