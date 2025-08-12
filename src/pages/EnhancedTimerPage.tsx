import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Timer, BarChart3, Settings, Brain, Coffee, Target, Zap } from 'lucide-react';
import EnhancedTimer from '../components/Timer/EnhancedTimer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import DatabaseStats from '../components/Stats/DatabaseStatsNew';

interface TimerPageProps {
  mode?: 'classic' | 'smart' | 'custom';
}

/**
 * 增强版计时器页面组件
 */
const EnhancedTimerPage: React.FC<TimerPageProps> = ({ mode = 'classic' }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('timer');
  const [timerState, setTimerState] = useState('focus');

  // 处理计时器状态变化
  const handleTimerStateChange = (state: string) => {
    setTimerState(state);
  };

  // 模拟统计数据
  const todayStats = {
    focusTime: 120, // 分钟
    breakTime: 30,  // 分钟
    completedSessions: 4,
    efficiency: 85   // 百分比
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="mr-4"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Timer className="w-6 h-6 mr-2" />
                增强版计时器
              </h1>
            </div>

            {/* 模式切换 */}
            <div className="flex space-x-2">
              <Button
                variant={mode === 'classic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => navigate('/timer/enhanced/classic')}
              >
                经典模式
              </Button>
              <Button
                variant={mode === 'smart' ? 'default' : 'outline'}
                size="sm"
                onClick={() => navigate('/timer/enhanced/smart')}
              >
                智能模式
              </Button>
              <Button
                variant={mode === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => navigate('/timer/enhanced/custom')}
              >
                自定义模式
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <main className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧 - 计时器 */}
          <div className="lg:col-span-2">
            <EnhancedTimer 
              onStateChange={handleTimerStateChange}
              className="mb-8"
            />

            {/* 今日统计 */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  今日统计
                </CardTitle>
                <CardDescription>
                  您今天的专注和休息数据
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {todayStats.focusTime}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">专注分钟</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {todayStats.breakTime}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">休息分钟</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {todayStats.completedSessions}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">完成番茄</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {todayStats.efficiency}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">效率评分</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧 - 附加信息和控制 */}
          <div className="space-y-6">
            {/* 当前状态卡片 */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  {timerState === 'focus' && (
                    <>
                      <Brain className="w-5 h-5 mr-2 text-blue-500" />
                      专注中
                    </>
                  )}
                  {timerState === 'break' && (
                    <>
                      <Coffee className="w-5 h-5 mr-2 text-green-500" />
                      休息中
                    </>
                  )}
                  {timerState === 'microBreak' && (
                    <>
                      <Coffee className="w-5 h-5 mr-2 text-yellow-500" />
                      微休息中
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {timerState === 'focus' && '保持专注，避免分心'}
                  {timerState === 'break' && '放松身心，为下一轮专注做准备'}
                  {timerState === 'microBreak' && '短暂休息，缓解眼部和身体疲劳'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">模式</span>
                    <span className="font-medium">
                      {mode === 'classic' && '经典模式'}
                      {mode === 'smart' && '智能模式'}
                      {mode === 'custom' && '自定义模式'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">建议</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {timerState === 'focus' && '保持坐姿正确'}
                      {timerState === 'break' && '站起来活动一下'}
                      {timerState === 'microBreak' && '远眺窗外'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                  快速操作
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => navigate('/stats/enhanced')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  查看统计
                </Button>
                <Button 
                  onClick={() => navigate('/tools/settings')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  计时器设置
                </Button>
                <Button 
                  onClick={() => navigate('/help/shortcuts')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Target className="w-4 h-4 mr-2" />
                  快捷键帮助
                </Button>
              </CardContent>
            </Card>

            {/* 数据库状态 */}
            <DatabaseStats />
          </div>
        </div>
      </main>
    </div>
  );
};

export default EnhancedTimerPage;