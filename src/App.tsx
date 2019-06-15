import React from 'react';
import logo from './logo.svg';
import './App.css';
import Canvas from './canvas/Canvas';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Testing</p>
      </header>
      <Canvas height={400} width={600} />
    </div>
  );
}

export default App;
