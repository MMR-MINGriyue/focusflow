import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Globe, Clock, MapPin } from 'lucide-react';
import WorldClock from '../components/WorldClock';

/**
 * 世界时钟页面组件
 */
const WorldClockPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Globe className="w-6 h-6 mr-2" />
              世界时钟
            </h1>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">全球时间</h2>
            <p className="text-gray-600 dark:text-gray-400">
              查看世界各地的时间，与全球团队保持同步
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 世界时钟组件 */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <WorldClock />
              </div>
            </div>

            {/* 侧边信息 */}
            <div className="space-y-6">
              {/* 时区信息 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  时区信息
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">本地时区</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">UTC偏移</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date().getTimezoneOffset() > 0 ? '-' : '+'}
                      {Math.floor(Math.abs(new Date().getTimezoneOffset()) / 60)}
                      :
                      {Math.abs(new Date().getTimezoneOffset() % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 时间转换提示 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-lg border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  时间转换提示
                </h3>
                <ul className="space-y-2 text-blue-700 dark:text-blue-300 text-sm">
                  <li>• 点击时钟上的城市可以查看更多详细信息</li>
                  <li>• 使用搜索框可以快速添加新的城市</li>
                  <li>• 拖动时钟可以重新排列顺序</li>
                  <li>• 双击时钟可以将其设置为12/24小时制</li>
                </ul>
              </div>

              {/* 相关功能 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">相关功能</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/timer')}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    计时器
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate('/stats')}
                  >
                    时区统计
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 时区知识 */}
          <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">关于时区</h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                时区是指地球上使用同一个标准时间的地区。全球共分为24个时区，每个时区相差一个小时。
                时区的划分主要基于经度，每15度经度划分一个时区。
              </p>
              <p>
                协调世界时（UTC）是世界各地调节时钟和时间的主要时间标准。UTC与格林威治标准时间（GMT）基本相同，
                但UTC是基于原子时钟的更精确的时间计量系统。
              </p>
              <p>
                夏令时（DST）是一种在夏季将时钟调快一小时的制度，目的是更好地利用夏季的白昼时间。
                并非所有国家和地区都实行夏令时，实行的时间和方式也各不相同。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorldClockPage;
