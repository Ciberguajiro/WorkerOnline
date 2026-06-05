import React from 'react';
import Terminal from './Terminal';

const App: React.FC = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1e1e1e',
    }}>
      <Terminal />
    </div>
  );
};

export default App;
