import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import DatabaseStats from './DatabaseStatsNew';
import { Button } from '../ui/Button';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  Award, 
  Clock, 
  Download, 
  RefreshCw,
  Database,
  Target,
  Zap,
  CheckCircle
} from 'lucide-react';

interface StatsProps {
  dailyStats: {
    date: string;
    focusTime: number;
    breakTime: number;
    efficiency: number;
  }[];
}

// 模拟数据
const weeklyData = [
  { name: '周一', focusTime: 120, breakTime: 30, efficiency: 85 },
  { name: '周二', focusTime: 90, breakTime: 25, efficiency: 78 },
  { name: '周三', focusTime: 150, breakTime: 40, efficiency: 92 },
  { name: '周四', focusTime: 80, breakTime: 20, efficiency: 70 },
  { name: '周五', focusTime: 110, breakTime: 35, efficiency: 88 },
  { name: '周六', focusTime: 60, breakTime: 15, efficiency: 65 },
  { name: '周日', focusTime: 40, breakTime: 10, efficiency: 60 },
];

const monthlyData = [
  { name: '第1周', focusTime: 520, breakTime: 130, efficiency: 82 },
  { name: '第2周', focusTime: 610, breakTime: 150, efficiency: 85 },
  { name: '第3周', focusTime: 480, breakTime: 120, efficiency: 78 },
  { name: '第4周', focusTime: 550, breakTime: 140, efficiency: 88 },
];

const pieData = [
  { name: '专注时间', value: 65 },
  { name: '休息时间', value: 20 },
  { name: '中断时间', value: 15 },
];

const COLORS = ['#3b82f6', '#10b981', '#ef4444'];

const EnhancedStats: React.FC<StatsProps> = ({ dailyStats }) => {
  const [activeTab, setActiveTab] = useState('daily');
  const [isLoading, setIsLoading] = useState(false);

  // 刷新数据
  const refreshData = () => {
    setIsLoading(true);
    // 模拟数据刷新
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // 导出数据
  const exportData = () => {
    // 模拟数据导出
    alert('数据导出功能已触发');
  };

  // 计算统计数据
  const calculateStats = () => {
    const totalFocusTime = dailyStats.reduce((sum, day) => sum + day.focusTime, 0);
    const avgEfficiency = dailyStats.reduce((sum, day) => sum + day.efficiency, 0) / dailyStats.length;
    const completedDays = dailyStats.filter(day => day.focusTime > 0).length;

    return {
      totalFocusTime,
      avgEfficiency: Math.round(avgEfficiency),
      completedDays,
      todayFocus: dailyStats[dailyStats.length - 1]?.focusTime || 0
    };
  };

  const stats = calculateStats();

  // 渲染图表
  const renderChart = () => {
    const data = activeTab === 'daily' ? dailyStats : 
                 activeTab === 'weekly' ? weeklyData : monthlyData;

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey={activeTab === 'daily' ? 'date' : 'name'} />
            <YAxis />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(229, 231, 235, 0.5)',
              }}
              itemStyle={{ color: '#1f2937' }}
              labelStyle={{ fontWeight: 'bold', color: '#1f2937' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="focusTime"
              name="专注时间(分钟)"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="efficiency"
              name="效率评分"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="w-6 h-6 mr-2" />
          专注统计
        </h2>
        <div className="flex space-x-2">
          <Button 
            onClick={refreshData}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            刷新数据
          </Button>
          <Button 
            onClick={exportData}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            导出数据
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              总专注时间
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.floor(stats.totalFocusTime / 60)}小时{stats.totalFocusTime % 60}分钟
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              平均效率
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.avgEfficiency}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              今日专注
            </CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.todayFocus}分钟
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              完成天数
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.completedDays}天
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表和数据库信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">
                    {activeTab === 'daily' && '每日专注统计'}
                    {activeTab === 'weekly' && '每周专注统计'}
                    {activeTab === 'monthly' && '每月专注统计'}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {activeTab === 'daily' && '最近7天的专注时间和效率变化'}
                    {activeTab === 'weekly' && '最近4周的专注时间和效率变化'}
                    {activeTab === 'monthly' && '最近6个月的专注时间和效率变化'}
                  </CardDescription>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    {activeTab === 'daily' && '最近7天'}
                    {activeTab === 'weekly' && '最近4周'}
                    {activeTab === 'monthly' && '最近6个月'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="daily">每日</TabsTrigger>
                  <TabsTrigger value="weekly">每周</TabsTrigger>
                  <TabsTrigger value="monthly">每月</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4">
                  {renderChart()}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* 数据库统计 */}
          <DatabaseStats />

          {/* 时间分布 */}
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                时间分布
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                今日时间使用情况
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(229, 231, 235, 0.5)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedStats;