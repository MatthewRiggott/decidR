import React from 'react';
import logo from './logo.svg';
import './App.css';
import Canvas from './canvas/Canvas';
import SelectRandom from './canvas/animator/SelectRandom';

const App: React.FC = () => {
  return (
    <div className="App">
      <Canvas height={400} width={600} animator={ new SelectRandom() } />
    </div>
  );
}

export default App;
