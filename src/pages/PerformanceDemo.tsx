import React from 'react';
import Phase1Demo from '../components/Timer/Phase1Demo';
import Phase2Demo from '../components/Timer/Phase2Demo';

const PerformanceDemo: React.FC = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">性能优化演示</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">阶段1: 基础实现</h2>
          <Phase1Demo />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">阶段2: 增强功能</h2>
          <Phase2Demo />
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mt-8">
        <h2 className="text-2xl font-semibold mb-4">性能对比</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">渲染性能</h3>
            <p className="text-gray-600 dark:text-gray-300">
              阶段2通过使用React.memo和useMemo优化，减少了不必要的重渲染，
              提升了组件的渲染性能。
            </p>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">内存使用</h3>
            <p className="text-gray-600 dark:text-gray-300">
              阶段2通过清理定时器和事件监听器，避免了内存泄漏问题，
              降低了应用的内存占用。
            </p>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">交互响应</h3>
            <p className="text-gray-600 dark:text-gray-300">
              阶段2通过使用useCallback优化事件处理函数，
              减少了子组件的不必要重渲染，提升了交互响应速度。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDemo;