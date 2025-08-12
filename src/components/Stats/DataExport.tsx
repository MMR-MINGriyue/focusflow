/**
 * 数据导出组件
 * 允许用户导出专注统计数据
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Calendar, Download, FileText, BarChart3 } from 'lucide-react';
import { useStatsStore } from '../../stores/statsStore';
import { format, subDays, subWeeks, subMonths, isAfter, isBefore, parseISO } from 'date-fns';
import { cn } from '../../utils/cn';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const exportOptions: ExportOption[] = [
  {
    id: 'json',
    name: 'JSON 格式',
    description: '导出为结构化的 JSON 文件',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: 'csv',
    name: 'CSV 格式',
    description: '导出为电子表格兼容的 CSV 文件',
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

const dateRangeOptions = [
  { id: 'week', name: '最近一周', days: 7 },
  { id: 'month', name: '最近一月', days: 30 },
  { id: 'quarter', name: '最近三月', days: 90 },
  { id: 'year', name: '最近一年', days: 365 },
  { id: 'all', name: '全部数据', days: null },
];

interface DataExportProps {
  className?: string;
}

const DataExport: React.FC<DataExportProps> = ({ className }) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('json');
  const [selectedRange, setSelectedRange] = useState<string>('month');
  const [isExporting, setIsExporting] = useState(false);

  // 获取统计数据
  const { stats, isLoading } = useStatsStore();

  // 获取日期范围
  const getDateRange = useCallback(() => {
    const rangeOption = dateRangeOptions.find(opt => opt.id === selectedRange);
    if (!rangeOption || rangeOption.days === null) {
      return { startDate: null, endDate: null };
    }

    const endDate = new Date();
    const startDate = subDays(endDate, rangeOption.days);

    return { startDate, endDate };
  }, [selectedRange]);

  // 过滤日期范围内的数据
  const filterDataByDateRange = useCallback(() => {
    const { startDate, endDate } = getDateRange();

    if (!startDate || !endDate) {
      return stats;
    }

    return stats.filter(stat => {
      const statDate = parseISO(stat.date);
      return isAfter(statDate, startDate) && isBefore(statDate, endDate);
    });
  }, [stats, getDateRange]);

  // 导出数据为 JSON
  const exportAsJson = useCallback((data: any[]) => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `focusflow-stats-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();

    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }, []);

  // 导出数据为 CSV
  const exportAsCsv = useCallback((data: any[]) => {
    if (data.length === 0) return;

    // 获取所有可能的键
    const allKeys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });

    // 创建CSV头部
    const headers = Array.from(allKeys);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // 处理包含逗号或引号的值
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `focusflow-stats-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();

    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }, []);

  // 处理导出
  const handleExport = useCallback(async () => {
    setIsExporting(true);

    try {
      const filteredData = filterDataByDateRange();

      if (selectedFormat === 'json') {
        exportAsJson(filteredData);
      } else if (selectedFormat === 'csv') {
        exportAsCsv(filteredData);
      }
    } catch (error) {
      console.error('导出数据时出错:', error);
    } finally {
      setIsExporting(false);
    }
  }, [selectedFormat, filterDataByDateRange, exportAsJson, exportAsCsv]);

  const selectedOption = exportOptions.find(opt => opt.id === selectedFormat);
  const selectedRangeOption = dateRangeOptions.find(opt => opt.id === selectedRange);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>数据导出</span>
        </CardTitle>
        <CardDescription>
          导出您的专注统计数据以便进行进一步分析
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 日期范围选择 */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            选择日期范围
          </label>
          <Select value={selectedRange} onValueChange={setSelectedRange}>
            <SelectTrigger>
              <SelectValue placeholder="选择日期范围" />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map(option => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 导出格式选择 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">导出格式</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exportOptions.map(option => (
              <div
                key={option.id}
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                  selectedFormat === option.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
                onClick={() => setSelectedFormat(option.id)}
              >
                <div className="text-blue-500 dark:text-blue-400">
                  {option.icon}
                </div>
                <div>
                  <h3 className="font-medium">{option.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 导出按钮 */}
        <div className="pt-2">
          <Button
            onClick={handleExport}
            disabled={isExporting || isLoading || stats.length === 0}
            className="w-full"
            size="lg"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? '导出中...' : '导出数据'}
          </Button>

          {stats.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
              没有可导出的数据
            </p>
          )}

          {selectedRangeOption && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
              将导出 {selectedRangeOption.name} 的数据
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExport;