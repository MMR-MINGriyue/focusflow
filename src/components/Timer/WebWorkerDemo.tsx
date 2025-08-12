import React, { useState, useEffect, useRef } from 'react';

const WebWorkerDemo: React.FC = () => {
  const [result, setResult] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // 创建Web Worker
    workerRef.current = new Worker(new URL('../../workers/fibonacci.worker.js', import.meta.url));

    // 监听来自Worker的消息
    workerRef.current.onmessage = (event) => {
      setResult(event.data);
      setIsCalculating(false);
    };

    // 清理函数
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const calculateFibonacci = () => {
    if (!workerRef.current || isCalculating) return;

    setIsCalculating(true);
    setResult(null);
    // 发送消息给Worker
    workerRef.current.postMessage(40); // 计算第40个斐波那契数
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Web Worker 演示</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-300">
        这个演示展示了如何使用Web Worker在后台线程中执行计算密集型任务，避免阻塞UI线程。
      </p>
      <button
        onClick={calculateFibonacci}
        disabled={isCalculating}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isCalculating ? '计算中...' : '计算斐波那契数'}
      </button>
      {result !== null && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded">
          <p className="text-green-800 dark:text-green-200">
            计算结果: {result}
          </p>
        </div>
      )}
    </div>
  );
};

export { WebWorkerDemo };
