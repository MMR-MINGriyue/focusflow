import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './Router.tsx'
import './index.css'
import { initializeApp } from './app/index'
import { ModernUIProvider } from './components/ui/ModernUIProvider'

// 应用初始化包装组件
const AppInitializer: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeApp();
        setIsInitialized(true);
      } catch (err) {
        console.error('App initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    };

    initApp();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">应用初始化失败</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在初始化应用...</p>
        </div>
      </div>
    );
  }

  return <AppRouter />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ModernUIProvider>
      <AppInitializer />
    </ModernUIProvider>
  </React.StrictMode>,
)
