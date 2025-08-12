import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Timer, 
  BarChart3, 
  Globe, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,

  Clock,
  Target,
  Award,
  Zap,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';
import { useStatsStore } from '../../stores/statsStore';
import { formatTimeShort } from '../../utils/formatTime';
import PerformanceMonitor from '../Performance/PerformanceMonitor';

interface DashboardProps {
  className?: string;
}

/**
 * 仪表盘组件
 * 展示应用的核心功能和数据概览
 */
const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const { start, pause, reset, isActive, timeLeft, currentState } = useUnifiedTimerStore();
  const { stats, loadStats } = useStatsStore();
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  useEffect(() => {
    if (!stats) {
      loadStats();
    }
  }, [loadStats, stats]);

  // 计算进度百分比
  const calculateProgress = () => {
    if (!stats) return 0;

    let totalSeconds = 0;
    switch (currentState) {
      case 'focus':
        totalSeconds = 25 * 60; // 25分钟
        break;
      case 'break':
        totalSeconds = 5 * 60; // 5分钟
        break;
      case 'microBreak':
        totalSeconds = 2 * 60; // 2分钟
        break;
      default:
        totalSeconds = 25 * 60;
    }

    const timeLeftSeconds = Math.floor(timeLeft / 1000);
    return ((totalSeconds - timeLeftSeconds) / totalSeconds) * 100;
  };

  // 格式化时间
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 获取会话类型文本
  const getSessionTypeText = () => {
    switch (currentState) {
      case 'focus':
        return '专注中';
      case 'break':
        return '休息中';
      case 'microBreak':
        return '微休息';
      default:
        return '准备';
    }
  };

  // 获取会话类型颜色
  const getSessionTypeColor = () => {
    switch (currentState) {
      case 'focus':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'break':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'microBreak':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  // 功能卡片
  const featureCards = [
    {
      title: '计时器',
      description: '使用番茄工作法提高专注力',
      icon: <Timer className="w-8 h-8 text-blue-500" />,
      link: '/timer',
      color: 'border-blue-200 dark:border-blue-800'
    },
    {
      title: '统计',
      description: '查看您的专注数据和效率趋势',
      icon: <BarChart3 className="w-8 h-8 text-green-500" />,
      link: '/stats',
      color: 'border-green-200 dark:border-green-800'
    },
    {
      title: '世界时钟',
      description: '查看世界各地的时间',
      icon: <Globe className="w-8 h-8 text-purple-500" />,
      link: '/tools/world-clock',
      color: 'border-purple-200 dark:border-purple-800'
    },
    {
      title: '设置',
      description: '自定义您的专注体验',
      icon: <Settings className="w-8 h-8 text-yellow-500" />,
      link: '/tools/settings',
      color: 'border-yellow-200 dark:border-yellow-800'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 欢迎区域 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                欢迎使用 FocusFlow
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                提高专注力，优化工作效率，实现工作与生活的平衡
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                onClick={() => isActive ? pause() : start()}
                size="lg"
                className={isActive ? "bg-yellow-500 hover:bg-yellow-600" : ""}
              >
                {isActive ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                {isActive ? '暂停专注' : '开始专注'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 计时器概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Timer className="w-5 h-5 mr-2" />
            当前会话
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex flex-col items-center">
                <div className={`text-lg font-medium px-3 py-1 rounded-full mb-4 ${getSessionTypeColor()}`}>
                  {getSessionTypeText()}
                </div>
                <div className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  {formatTime(timeLeft)}
                </div>
                <div className="w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => isActive ? pause() : start()}
                    variant={isActive ? "secondary" : "default"}
                  >
                    {isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {isActive ? '暂停' : '开始'}
                  </Button>
                  <Button
                    onClick={reset}
                    variant="outline"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    重置
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Clock className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="font-medium text-blue-700 dark:text-blue-300">今日专注</span>
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {stats ? formatTimeShort(stats.daily.totalFocusTime * 60) : '0分钟'}
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Target className="w-5 h-5 text-green-500 mr-2" />
                  <span className="font-medium text-green-700 dark:text-green-300">完成番茄</span>
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {stats ? stats.daily.completedSessions : 0}
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Award className="w-5 h-5 text-purple-500 mr-2" />
                  <span className="font-medium text-purple-700 dark:text-purple-300">连续天数</span>
                </div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {stats ? stats.focusStreak : 0}天
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统计概览 */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              统计概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.floor(stats.allTime.totalFocusTime / 60)}小时{stats.allTime.totalFocusTime % 60}分钟
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">总专注时间</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.allTime.completedSessions}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">完成会话</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.focusStreak}天
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">当前连续天数</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.allTime.efficiencyScore}/100
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">效率评分</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 功能卡片 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">探索功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureCards.map((card, index) => (
            <Link key={index} to={card.link}>
              <Card className={`h-full border-2 hover:shadow-md transition-shadow ${card.color}`}>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="mb-4">
                    {card.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* 性能监控 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              性能监控
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
            >
              {showPerformanceMonitor ? '隐藏监控' : '显示监控'}
            </Button>
          </div>
        </CardHeader>
        {showPerformanceMonitor && (
          <CardContent>
            <PerformanceMonitor autoRefresh={true} />
          </CardContent>
        )}
      </Card>

      {/* 最近活动 */}
      {stats && stats.sessionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              最近活动
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.sessionHistory.slice(0, 5).map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {session.date}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {session.focusTime}分钟专注 · {session.sessions}个会话
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {Math.round((session.focusTime / (session.sessions * 25)) * 100)}% 效率
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
