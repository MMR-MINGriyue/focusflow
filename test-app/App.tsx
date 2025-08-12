import React from 'react';
import TimerStyleTestApp from './TimerStyleTestApp';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>TimerStyleManager 测试应用</h1>
        <p>用于测试计时器样式管理器功能</p>
      </header>
      <main className="app-main">
        <TimerStyleTestApp />
      </main>
    </div>
  );
}

export default App;