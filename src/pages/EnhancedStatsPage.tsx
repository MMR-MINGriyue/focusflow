import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, BarChart3, Calendar, TrendingUp, Award, Clock, Settings, Database } from 'lucide-react';
import EnhancedStats from '../components/Stats/EnhancedStats';
import { useStatsStore } from '../stores/statsStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import DatabaseStats from '../components/Stats/DatabaseStatsNew';

interface StatsPageProps {
  view?: 'daily' | 'weekly' | 'monthly';
}

// 模拟数据
const mockDailyStats = [
  { date: '06-10', focusTime: 120, breakTime: 30, efficiency: 85 },
  { date: '06-11', focusTime: 90, breakTime: 25, efficiency: 78 },
  { date: '06-12', focusTime: 150, breakTime: 40, efficiency: 92 },
  { date: '06-13', focusTime: 80, breakTime: 20, efficiency: 70 },
  { date: '06-14', focusTime: 110, breakTime: 35, efficiency: 88 },
  { date: '06-15', focusTime: 60, breakTime: 15, efficiency: 65 },
  { date: '06-16', focusTime: 40, breakTime: 10, efficiency: 60 },
];

/**
 * 增强版统计页面组件
 */
const EnhancedStatsPage: React.FC<StatsPageProps> = ({ view = 'daily' }) => {
  const navigate = useNavigate();
  const { stats, isLoading, error, loadStats } = useStatsStore();
  const [activeView, setActiveView] = useState<'daily' | 'weekly' | 'monthly'>(view);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!stats) {
      loadStats();
    }
  }, [loadStats, stats]);

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
                <BarChart3 className="w-6 h-6 mr-2" />
                专注统计
              </h1>
            </div>

            {/* 视图切换 */}
            <div className="flex space-x-2">
              <Button
                variant={activeView === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('daily')}
              >
                每日
              </Button>
              <Button
                variant={activeView === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('weekly')}
              >
                每周
              </Button>
              <Button
                variant={activeView === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('monthly')}
              >
                每月
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <main className="container mx-auto py-8 px-4">
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">加载统计数据时出错</h2>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button
              onClick={loadStats}
              variant="outline"
            >
              重试
            </Button>
          </div>
        )}

        {stats && !isLoading && !error && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="charts">图表分析</TabsTrigger>
              <TabsTrigger value="database">数据库信息</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* 统计卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      总专注时间
                    </CardTitle>
                    <Clock className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.floor(stats.allTime.totalFocusTime / 60)}小时{stats.allTime.totalFocusTime % 60}分钟
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      完成会话
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.allTime.completedSessions}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      当前连续天数
                    </CardTitle>
                    <Award className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.focusStreak}天
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      效率评分
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.allTime.efficiencyScore}/100
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 成就徽章 */}
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">成就徽章</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    解锁成就，记录您的专注历程
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-lg border-2 ${
                      stats.focusStreak >= 7
                        ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                    }`}>
                      <div className="text-center">
                        <div className="text-3xl mb-2">🥉</div>
                        <h3 className="font-medium mb-1">新芽勋章</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">连续7天专注</p>
                        {stats.focusStreak >= 7 && (
                          <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 font-medium">已获得</div>
                        )}
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border-2 ${
                      stats.focusStreak >= 14
                        ? 'border-gray-400 bg-gray-100 dark:bg-gray-800/50'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                    }`}>
                      <div className="text-center">
                        <div className="text-3xl mb-2">🥈</div>
                        <h3 className="font-medium mb-1">心流入门</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">连续14天专注</p>
                        {stats.focusStreak >= 14 && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">已获得</div>
                        )}
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border-2 ${
                      stats.focusStreak >= 30
                        ? 'border-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                    }`}>
                      <div className="text-center">
                        <div className="text-3xl mb-2">🥇</div>
                        <h3 className="font-medium mb-1">深度专注者</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">连续30天专注</p>
                        {stats.focusStreak >= 30 && (
                          <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 font-medium">已获得</div>
                        )}
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border-2 ${
                      stats.allTime.completedSessions >= 100
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                    }`}>
                      <div className="text-center">
                        <div className="text-3xl mb-2">🏆</div>
                        <h3 className="font-medium mb-1">番茄大师</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">完成100个番茄</p>
                        {stats.allTime.completedSessions >= 100 && (
                          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">已获得</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts" className="space-y-6">
              <EnhancedStats dailyStats={mockDailyStats} />
            </TabsContent>

            <TabsContent value="database" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DatabaseStats />

                <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white flex items-center">
                      <Database className="w-5 h-5 mr-2 text-blue-500" />
                      数据库管理
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      管理您的应用数据
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Button className="w-full justify-start" variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        数据库设置
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        导入数据
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        导出数据
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Award className="w-4 h-4 mr-2" />
                        清理缓存
                      </Button>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">数据安全</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        您的所有数据都安全地存储在本地，不会上传到任何服务器。
                      </p>
                      <Button className="w-full" variant="outline">
                        备份数据库
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default EnhancedStatsPage;