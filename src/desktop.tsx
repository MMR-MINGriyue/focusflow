import * as React from 'react';
import { createRoot } from 'react-dom/client';
import AppRouter from './Router';
import './index.css';

// 桌面应用入口组件
const DesktopApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <AppRouter />
    </div>
  );
};

// 渲染应用
const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);
root.render(<DesktopApp />);
