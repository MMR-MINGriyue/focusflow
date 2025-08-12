/**
 * 数据导出组件
 * 提供多种格式的数据导出功能
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { cn } from '../../utils/cn';
import { 
  Download, 
  FileText, 
  Table, 
  FileSpreadsheet, 
  FileImage,
  Calendar,
  Settings,
  CheckCircle,
  Clock,
  Tag,
  StickyNote,
  RefreshCw
} from 'lucide-react';

// 导出格式类型
export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'pdf';

// 导出选项
export interface ExportOptions {
  format: ExportFormat;
  dateRange: {
    start: Date;
    end: Date;
  };
  includeSettings: boolean;
  includeStatistics: boolean;
  includeTags: boolean;
  includeNotes: boolean;
  includeBreaks: boolean;
  groupBy: 'day' | 'week' | 'month' | 'none';
  timezone: string;
}

// 导出任务状态
export interface ExportTask {
  id: string;
  format: ExportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  error?: string;
  recordCount: number;
  fileSize?: number;
}

/**
 * 数据导出组件
 */
export const DataExport: React.FC<{
  className?: string;
}> = ({ className }) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
      end: new Date()
    },
    includeSettings: true,
    includeStatistics: true,
    includeTags: true,
    includeNotes: true,
    includeBreaks: true,
    groupBy: 'none',
    timezone: 'Asia/Shanghai'
  });

  const [exportTasks, setExportTasks] = useState<ExportTask[]>([
    {
      id: '1',
      format: 'json',
      status: 'completed',
      progress: 100,
      createdAt: new Date(Date.now() - 3600000), // 1小时前
      completedAt: new Date(Date.now() - 3500000),
      downloadUrl: '/exports/focus-data-2024-01-15.json',
      recordCount: 156,
      fileSize: 2048576 // 2MB
    },
    {
      id: '2',
      format: 'csv',
      status: 'processing',
      progress: 65,
      createdAt: new Date(Date.now() - 300000), // 5分钟前
      recordCount: 234
    },
    {
      id: '3',
      format: 'pdf',
      status: 'failed',
      progress: 0,
      createdAt: new Date(Date.now() - 1800000), // 30分钟前
      error: '生成PDF时发生错误',
      recordCount: 89
    }
  ]);

  const [loading, setLoading] = useState(false);

  // 格式配置
  const formatConfig = {
    json: {
      icon: FileText,
      name: 'JSON',
      description: '结构化数据格式，适合程序处理',
      extension: '.json',
      color: 'text-blue-600'
    },
    csv: {
      icon: Table,
      name: 'CSV',
      description: '逗号分隔值，适合Excel等表格软件',
      extension: '.csv',
      color: 'text-green-600'
    },
    xlsx: {
      icon: FileSpreadsheet,
      name: 'Excel',
      description: 'Excel工作簿格式，支持多个工作表',
      extension: '.xlsx',
      color: 'text-emerald-600'
    },
    pdf: {
      icon: FileImage,
      name: 'PDF',
      description: '便携式文档格式，适合打印和分享',
      extension: '.pdf',
      color: 'text-red-600'
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // 开始导出
  const handleStartExport = useCallback(async () => {
    setLoading(true);

    // 创建新的导出任务
    const newTask: ExportTask = {
      id: Date.now().toString(),
      format: exportOptions.format,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      recordCount: Math.floor(Math.random() * 500) + 50 // 模拟记录数
    };

    setExportTasks(prev => [newTask, ...prev]);

    // 模拟导出过程
    const taskId = newTask.id;
    
    // 更新为处理中
    setTimeout(() => {
      setExportTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'processing' as const }
          : task
      ));
    }, 500);

    // 模拟进度更新
    for (let progress = 10; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setExportTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, progress }
          : task
      ));
    }

    // 完成导出
    setTimeout(() => {
      setExportTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: 'completed' as const,
              completedAt: new Date(),
              downloadUrl: `/exports/focus-data-${formatDate(new Date())}${formatConfig[exportOptions.format].extension}`,
              fileSize: Math.floor(Math.random() * 5000000) + 1000000 // 1-5MB
            }
          : task
      ));
      setLoading(false);
    }, 2500);
  }, [exportOptions]);

  // 下载文件
  const handleDownload = useCallback((task: ExportTask) => {
    if (!task.downloadUrl) return;
    
    // 模拟下载
    const link = document.createElement('a');
    link.href = task.downloadUrl;
    link.download = task.downloadUrl.split('/').pop() || 'export';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // 删除任务
  const handleDeleteTask = useCallback((taskId: string) => {
    setExportTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  // 获取状态图标
  const getStatusIcon = (status: ExportTask['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <FileText className="h-4 w-4 text-red-500" />;
    }
  };

  // 获取状态文本
  const getStatusText = (status: ExportTask['status']) => {
    switch (status) {
      case 'pending':
        return '等待中';
      case 'processing':
        return '处理中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* 标题 */}
      <div>
        <h2 className="text-2xl font-bold">数据导出</h2>
        <p className="text-muted-foreground">将您的专注数据导出为不同格式</p>
      </div>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="export">导出设置</TabsTrigger>
          <TabsTrigger value="tasks">导出任务</TabsTrigger>
        </TabsList>

        {/* 导出设置 */}
        <TabsContent value="export" className="space-y-6">
          {/* 格式选择 */}
          <Card>
            <CardHeader>
              <CardTitle>选择导出格式</CardTitle>
              <CardDescription>选择最适合您需求的数据格式</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(formatConfig).map(([format, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <div
                      key={format}
                      className={cn(
                        'p-4 border rounded-lg cursor-pointer transition-all',
                        exportOptions.format === format
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                      onClick={() => setExportOptions(prev => ({ ...prev, format: format as ExportFormat }))}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <IconComponent className={cn('h-5 w-5', config.color)} />
                        <span className="font-medium">{config.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 日期范围 */}
          <Card>
            <CardHeader>
              <CardTitle>日期范围</CardTitle>
              <CardDescription>选择要导出的数据时间范围</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="开始日期"
                  value={formatDate(exportOptions.dateRange.start)}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    dateRange: {
                      ...prev.dateRange,
                      start: new Date(e.target.value)
                    }
                  }))}
                />
                <Input
                  type="date"
                  label="结束日期"
                  value={formatDate(exportOptions.dateRange.end)}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    dateRange: {
                      ...prev.dateRange,
                      end: new Date(e.target.value)
                    }
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* 导出选项 */}
          <Card>
            <CardHeader>
              <CardTitle>导出选项</CardTitle>
              <CardDescription>选择要包含在导出中的数据类型</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeSettings}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeSettings: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">包含设置</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeStatistics}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeStatistics: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">包含统计数据</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeTags}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeTags: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">包含标签</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeNotes}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeNotes: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <StickyNote className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">包含笔记</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeBreaks}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeBreaks: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">包含休息时间</span>
                  </label>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">数据分组</label>
                    <select
                      value={exportOptions.groupBy}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        groupBy: e.target.value as ExportOptions['groupBy']
                      }))}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      <option value="none">不分组</option>
                      <option value="day">按天分组</option>
                      <option value="week">按周分组</option>
                      <option value="month">按月分组</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 开始导出 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">准备导出</h3>
                  <p className="text-sm text-muted-foreground">
                    格式: {formatConfig[exportOptions.format].name} | 
                    日期: {formatDate(exportOptions.dateRange.start)} 至 {formatDate(exportOptions.dateRange.end)}
                  </p>
                </div>
                <Button
                  onClick={handleStartExport}
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  开始导出
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 导出任务 */}
        <TabsContent value="tasks" className="space-y-4">
          {exportTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Download className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无导出任务</h3>
                <p className="text-muted-foreground text-center">
                  创建您的第一个导出任务
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {exportTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(task.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {formatConfig[task.format].name} 导出
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {getStatusText(task.status)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {task.recordCount} 条记录 • 
                            创建于 {task.createdAt.toLocaleString('zh-CN')}
                            {task.fileSize && ` • ${formatFileSize(task.fileSize)}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {task.status === 'completed' && task.downloadUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(task)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            下载
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          删除
                        </Button>
                      </div>
                    </div>

                    {/* 进度条 */}
                    {task.status === 'processing' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>处理进度</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 错误信息 */}
                    {task.status === 'failed' && task.error && (
                      <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-sm text-destructive">{task.error}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataExport;