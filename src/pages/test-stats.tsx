import { useState, useEffect } from 'react';
import DatabaseStats from '../components/Stats/DatabaseStats';

const TestStatsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 模拟加载过程
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // 模拟错误状态
  const simulateError = () => {
    setError('无法连接到数据库，请检查网络连接');
    setTimeout(() => setError(null), 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">数据库统计测试页面</h1>

      <div className="mb-8">
        <p className="mb-4">这个页面用于测试 DatabaseStats 组件的功能。组件会显示数据库中的各种统计数据。</p>

        <div className="flex space-x-4 mb-6">
          <button 
            onClick={() => setIsLoading(!isLoading)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            {isLoading ? '停止加载' : '模拟加载状态'}
          </button>

          <button 
            onClick={simulateError}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            模拟错误状态
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <DatabaseStats isLoading={isLoading} error={error} />
      </div>
    </div>
  );
};

export default TestStatsPage;
