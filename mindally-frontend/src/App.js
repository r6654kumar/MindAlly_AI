import React from 'react';
import './App.css';
import Chat from './Components/Chat';
function App() {
  return (
    <div className="App">
      <header className="header">
        <h1>MindAlly</h1>
        <p>Your Mental Health Companion</p>
      </header>
      <Chat />
    </div>
  );
}

export default App;