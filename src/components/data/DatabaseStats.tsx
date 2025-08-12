/**
 * 数据库统计组件
 * 显示数据库使用情况和统计信息
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { BarChart } from '../charts/BarChart';
import { PieChart } from '../charts/PieChart';
import { cn } from '../../utils/cn';
import { 
  Database, 
  HardDrive, 
  FileText, 
  Clock, 
  TrendingUp, 
  Download, 
  Upload, 
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

// 数据库统计类型
export interface DatabaseStatistics {
  totalSessions: number;
  totalFocusTime: number; // 秒
  totalBreakTime: number; // 秒
  averageSessionDuration: number; // 秒
  longestSession: number; // 秒
  shortestSession: number; // 秒
  totalDays: number;
  averageDailyFocusTime: number; // 秒
  mostProductiveDay: string;
  mostProductiveHour: number;
  efficiency: {
    average: number;
    highest: number;
    lowest: number;
  };
  interruptions: {
    total: number;
    average: number;
  };
  tags: Array<{
    name: string;
    count: number;
    totalTime: number;
  }>;
  monthlyData: Array<{
    month: string;
    sessions: number;
    focusTime: number;
    efficiency: number;
  }>;
}

// 存储信息类型
export interface StorageInfo {
  totalSize: number; // 字节
  usedSize: number; // 字节
  availableSize: number; // 字节
  sessionCount: number;
  backupCount: number;
  lastBackup: Date | null;
  lastCleanup: Date | null;
  fragmentationLevel: number; // 0-100
}

// 数据完整性检查结果
export interface IntegrityCheckResult {
  isHealthy: boolean;
  issues: Array<{
    type: 'warning' | 'error';
    message: string;
    count?: number;
  }>;
  checkedTables: string[];
  totalRecords: number;
  corruptedRecords: number;
  missingReferences: number;
}

/**
 * 数据库统计组件
 */
export const DatabaseStats: React.FC<{
  className?: string;
}> = ({ className }) => {
  const [statistics, setStatistics] = useState<DatabaseStatistics | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [integrityResult, setIntegrityResult] = useState<IntegrityCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 模拟数据加载
  const loadData = useCallback(async () => {
    setLoading(true);
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟统计数据
    setStatistics({
      totalSessions: 1247,
      totalFocusTime: 89640, // 24.9小时
      totalBreakTime: 12480, // 3.47小时
      averageSessionDuration: 1800, // 30分钟
      longestSession: 5400, // 1.5小时
      shortestSession: 300, // 5分钟
      totalDays: 45,
      averageDailyFocusTime: 1992, // 33.2分钟
      mostProductiveDay: '2024-01-15',
      mostProductiveHour: 14,
      efficiency: {
        average: 78.5,
        highest: 95.2,
        lowest: 45.8
      },
      interruptions: {
        total: 234,
        average: 0.19
      },
      tags: [
        { name: '工作', count: 456, totalTime: 45600 },
        { name: '学习', count: 234, totalTime: 23400 },
        { name: '阅读', count: 123, totalTime: 12300 },
        { name: '编程', count: 89, totalTime: 8900 }
      ],
      monthlyData: [
        { month: '2024-01', sessions: 234, focusTime: 18720, efficiency: 76.2 },
        { month: '2024-02', sessions: 267, focusTime: 21360, efficiency: 78.9 },
        { month: '2024-03', sessions: 298, focusTime: 23840, efficiency: 81.3 },
        { month: '2024-04', sessions: 312, focusTime: 24960, efficiency: 79.7 },
        { month: '2024-05', sessions: 136, focusTime: 10880, efficiency: 75.4 }
      ]
    });

    // 模拟存储信息
    setStorageInfo({
      totalSize: 104857600, // 100MB
      usedSize: 15728640, // 15MB
      availableSize: 89128960, // 85MB
      sessionCount: 1247,
      backupCount: 5,
      lastBackup: new Date(Date.now() - 86400000), // 1天前
      lastCleanup: new Date(Date.now() - 604800000), // 1周前
      fragmentationLevel: 12.5
    });

    // 模拟完整性检查结果
    setIntegrityResult({
      isHealthy: true,
      issues: [
        { type: 'warning', message: '发现3个孤立的会话记录', count: 3 },
        { type: 'warning', message: '2个标签没有关联的会话', count: 2 }
      ],
      checkedTables: ['sessions', 'tags', 'settings', 'statistics'],
      totalRecords: 1247,
      corruptedRecords: 0,
      missingReferences: 5
    });

    setLoading(false);
  }, []);

  // 刷新数据
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // 初始加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">数据库统计</h2>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 标题和操作 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">数据库统计</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            刷新
          </Button>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总会话数</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.totalSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              平均每天 {Math.round((statistics?.totalSessions || 0) / (statistics?.totalDays || 1))} 个会话
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总专注时间</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(statistics?.totalFocusTime || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              平均每天 {formatDuration(statistics?.averageDailyFocusTime || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均效率</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.efficiency.average.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              最高 {statistics?.efficiency.highest.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">存储使用</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(storageInfo?.usedSize || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              共 {formatFileSize(storageInfo?.totalSize || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="storage">存储</TabsTrigger>
          <TabsTrigger value="integrity">完整性</TabsTrigger>
          <TabsTrigger value="charts">图表</TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>会话统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">平均会话时长</span>
                  <span className="font-medium">
                    {formatDuration(statistics?.averageSessionDuration || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最长会话</span>
                  <span className="font-medium">
                    {formatDuration(statistics?.longestSession || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最短会话</span>
                  <span className="font-medium">
                    {formatDuration(statistics?.shortestSession || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">总中断次数</span>
                  <span className="font-medium">{statistics?.interruptions.total}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>时间分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">总休息时间</span>
                  <span className="font-medium">
                    {formatDuration(statistics?.totalBreakTime || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最高效的一天</span>
                  <span className="font-medium">
                    {new Date(statistics?.mostProductiveDay || '').toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最高效时段</span>
                  <span className="font-medium">
                    {statistics?.mostProductiveHour}:00
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">记录天数</span>
                  <span className="font-medium">{statistics?.totalDays} 天</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 标签统计 */}
          <Card>
            <CardHeader>
              <CardTitle>标签使用统计</CardTitle>
              <CardDescription>最常使用的标签和对应的专注时间</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statistics?.tags.map((tag, index) => (
                  <div key={tag.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="font-medium">{tag.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{tag.count} 次</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDuration(tag.totalTime)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 存储标签页 */}
        <TabsContent value="storage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>存储使用情况</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>已使用</span>
                    <span>{formatFileSize(storageInfo?.usedSize || 0)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${((storageInfo?.usedSize || 0) / (storageInfo?.totalSize || 1)) * 100}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>{formatFileSize(storageInfo?.totalSize || 0)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">会话记录</span>
                    <span className="font-medium">{storageInfo?.sessionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">备份数量</span>
                    <span className="font-medium">{storageInfo?.backupCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">碎片化程度</span>
                    <span className="font-medium">{storageInfo?.fragmentationLevel}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>维护信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">最后备份</span>
                    <span className="font-medium">
                      {storageInfo?.lastBackup 
                        ? storageInfo.lastBackup.toLocaleDateString('zh-CN')
                        : '从未备份'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">最后清理</span>
                    <span className="font-medium">
                      {storageInfo?.lastCleanup 
                        ? storageInfo.lastCleanup.toLocaleDateString('zh-CN')
                        : '从未清理'
                      }
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    创建备份
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    清理数据
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 完整性标签页 */}
        <TabsContent value="integrity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {integrityResult?.isHealthy ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                数据完整性检查
              </CardTitle>
              <CardDescription>
                最后检查时间: {new Date().toLocaleString('zh-CN')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {integrityResult?.checkedTables.length}
                  </div>
                  <div className="text-xs text-muted-foreground">检查表</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {integrityResult?.totalRecords.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">总记录数</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {integrityResult?.corruptedRecords}
                  </div>
                  <div className="text-xs text-muted-foreground">损坏记录</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {integrityResult?.missingReferences}
                  </div>
                  <div className="text-xs text-muted-foreground">缺失引用</div>
                </div>
              </div>

              {integrityResult?.issues && integrityResult.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">发现的问题:</h4>
                  {integrityResult.issues.map((issue, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md text-sm',
                        issue.type === 'error' 
                          ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                          : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                      )}
                    >
                      {issue.type === 'error' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Info className="h-4 w-4" />
                      )}
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重新检查
                </Button>
                <Button variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  修复问题
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 图表标签页 */}
        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>月度会话趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={[{
                    id: 'sessions',
                    name: '会话数',
                    data: statistics?.monthlyData.map(item => ({
                      x: item.month,
                      y: item.sessions
                    })) || []
                  }]}
                  config={{ height: 200 }}
                  xAxis={{ tickFormat: (value) => value.split('-')[1] + '月' }}
                  yAxis={{ tickFormat: (value) => `${value}次` }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>标签使用分布</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart
                  data={statistics?.tags.map(tag => ({
                    id: tag.name,
                    label: tag.name,
                    value: tag.count
                  })) || []}
                  config={{ height: 200 }}
                  showLabels={true}
                  showPercentages={true}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatabaseStats;