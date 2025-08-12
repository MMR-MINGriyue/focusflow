import React from 'react';
import WorldClockComponent from './WorldClock/WorldClock';

/**
 * 世界时钟页面组件
 * 显示世界各地的时间，帮助用户了解不同时区的时间
 */
const WorldClock: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">世界时钟</h1>
        <p className="text-gray-600">查看世界各地的时间，帮助您与全球团队保持同步</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <WorldClockComponent />
      </div>
    </div>
  );
};

export default WorldClock;