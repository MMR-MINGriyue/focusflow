/**
 * FocusFlow专用图表组件
 * 为专注时间管理应用定制的图表组件
 */

import React, { useMemo } from 'react';
import { LineChart } from './LineChart';
import { BarChart } from './BarChart';
import { PieChart, DonutChart } from './PieChart';
import { chartUtils } from './BaseChart';
import { ChartSeries, ChartDataPoint, PieChartData } from '../../types/charts';

// 专注会话数据类型
export interface FocusSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // 秒
  type: 'focus' | 'break' | 'longBreak' | 'microBreak';
  efficiency?: number; // 0-100
  interruptions?: number;
  tags?: string[];
}

// 每日统计数据类型
export interface DailyStats {
  date: Date;
  totalFocusTime: number; // 秒
  totalBreakTime: number; // 秒
  sessionsCount: number;
  averageEfficiency: number;
  interruptions: number;
  microBreaksCount: number;
}

// 周统计数据类型
export interface WeeklyStats {
  week: number;
  year: number;
  totalFocusTime: number;
  totalBreakTime: number;
  sessionsCount: number;
  averageEfficiency: number;
  dailyStats: DailyStats[];
}

/**
 * 专注时间趋势图
 */
export interface FocusTimeTrendProps {
  data: DailyStats[];
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  showBreakTime?: boolean;
  className?: string;
}

export const FocusTimeTrend: React.FC<FocusTimeTrendProps> = ({
  data,
  timeRange,
  showBreakTime = true,
  className
}) => {
  const chartData = useMemo(() => {
    const series: ChartSeries[] = [
      {
        id: 'focus',
        name: '专注时间',
        data: data.map(stat => ({
          x: stat.date.toISOString().split('T')[0],
          y: stat.totalFocusTime / 3600, // 转换为小时
          label: chartUtils.formatDuration(stat.totalFocusTime)
        })),
        color: '#3b82f6'
      }
    ];

    if (showBreakTime) {
      series.push({
        id: 'break',
        name: '休息时间',
        data: data.map(stat => ({
          x: stat.date.toISOString().split('T')[0],
          y: stat.totalBreakTime / 3600, // 转换为小时
          label: chartUtils.formatDuration(stat.totalBreakTime)
        })),
        color: '#10b981'
      });
    }

    return series;
  }, [data, showBreakTime]);

  const formatTooltip = (value: number, name: string) => {
    return chartUtils.formatDuration(value * 3600); // 转换回秒
  };

  return (
    <LineChart
      data={chartData}
      className={className}
      config={{
        height: 300,
        animation: { enabled: true, duration: 500, easing: 'ease-out' }
      }}
      xAxis={{
        type: 'time',
        tickFormat: (value) => {
          const date = new Date(value);
          switch (timeRange) {
            case 'week':
              return date.toLocaleDateString('zh-CN', { weekday: 'short' });
            case 'month':
              return date.toLocaleDateString('zh-CN', { day: 'numeric' });
            case 'quarter':
            case 'year':
              return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
            default:
              return date.toLocaleDateString('zh-CN');
          }
        },
        grid: true
      }}
      yAxis={{
        tickFormat: (value) => `${value}h`,
        grid: true
      }}
      tooltip={{
        formatter: formatTooltip
      }}
      smooth={true}
      showPoints={true}
    />
  );
};

/**
 * 效率分布图
 */
export interface EfficiencyDistributionProps {
  data: FocusSession[];
  className?: string;
}

export const EfficiencyDistribution: React.FC<EfficiencyDistributionProps> = ({
  data,
  className
}) => {
  const chartData = useMemo(() => {
    // 按效率区间分组
    const ranges = [
      { min: 0, max: 20, label: '0-20%', color: '#ef4444' },
      { min: 20, max: 40, label: '20-40%', color: '#f97316' },
      { min: 40, max: 60, label: '40-60%', color: '#eab308' },
      { min: 60, max: 80, label: '60-80%', color: '#22c55e' },
      { min: 80, max: 100, label: '80-100%', color: '#16a34a' }
    ];

    const distribution = ranges.map(range => {
      const count = data.filter(session => 
        session.efficiency !== undefined &&
        session.efficiency >= range.min && 
        session.efficiency < range.max
      ).length;

      return {
        id: range.label,
        label: range.label,
        value: count,
        color: range.color
      };
    }).filter(item => item.value > 0);

    return distribution;
  }, [data]);

  return (
    <DonutChart
      data={chartData}
      className={className}
      config={{
        height: 300
      }}
      innerRadius={60}
      showLabels={true}
      showPercentages={true}
      labelPosition="outside"
    />
  );
};

/**
 * 每日会话分布图
 */
export interface DailySessionDistributionProps {
  data: FocusSession[];
  date: Date;
  className?: string;
}

export const DailySessionDistribution: React.FC<DailySessionDistributionProps> = ({
  data,
  date,
  className
}) => {
  const chartData = useMemo(() => {
    // 按小时分组统计会话数
    const hourlyData: ChartSeries[] = [{
      id: 'sessions',
      name: '会话数',
      data: []
    }];

    // 初始化24小时数据
    for (let hour = 0; hour < 24; hour++) {
      const sessionsInHour = data.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate.toDateString() === date.toDateString() &&
               sessionDate.getHours() === hour;
      }).length;

      hourlyData[0].data.push({
        x: `${hour.toString().padStart(2, '0')}:00`,
        y: sessionsInHour
      });
    }

    return hourlyData;
  }, [data, date]);

  return (
    <BarChart
      data={chartData}
      className={className}
      config={{
        height: 200
      }}
      xAxis={{
        tickFormat: (value) => value,
        grid: false
      }}
      yAxis={{
        tickFormat: (value) => `${value}次`,
        grid: true
      }}
      barWidth={20}
      borderRadius={4}
    />
  );
};

/**
 * 专注类型分布图
 */
export interface FocusTypeDistributionProps {
  data: FocusSession[];
  className?: string;
}

export const FocusTypeDistribution: React.FC<FocusTypeDistributionProps> = ({
  data,
  className
}) => {
  const chartData = useMemo(() => {
    const typeStats = data.reduce((acc, session) => {
      acc[session.type] = (acc[session.type] || 0) + session.duration;
      return acc;
    }, {} as Record<string, number>);

    const typeLabels = {
      focus: '专注时间',
      break: '短休息',
      longBreak: '长休息',
      microBreak: '微休息'
    };

    const typeColors = {
      focus: '#3b82f6',
      break: '#10b981',
      longBreak: '#8b5cf6',
      microBreak: '#f59e0b'
    };

    return Object.entries(typeStats).map(([type, duration]) => ({
      id: type,
      label: typeLabels[type as keyof typeof typeLabels] || type,
      value: duration,
      color: typeColors[type as keyof typeof typeColors]
    }));
  }, [data]);

  return (
    <PieChart
      data={chartData}
      className={className}
      config={{
        height: 300
      }}
      showLabels={true}
      showPercentages={true}
      labelPosition="outside"
      tooltip={{
        formatter: (data) => chartUtils.formatDuration(data.y)
      }}
    />
  );
};

/**
 * 周效率热力图
 */
export interface WeeklyEfficiencyHeatmapProps {
  data: DailyStats[];
  className?: string;
}

export const WeeklyEfficiencyHeatmap: React.FC<WeeklyEfficiencyHeatmapProps> = ({
  data,
  className
}) => {
  // 这里可以实现热力图，由于Recharts不直接支持热力图，
  // 我们可以使用自定义组件或第三方库
  return (
    <div className={className}>
      <div className="text-center text-muted-foreground">
        热力图组件待实现
      </div>
    </div>
  );
};

/**
 * 专注目标进度图
 */
export interface FocusGoalProgressProps {
  currentValue: number;
  targetValue: number;
  unit: string;
  label: string;
  className?: string;
}

export const FocusGoalProgress: React.FC<FocusGoalProgressProps> = ({
  currentValue,
  targetValue,
  unit,
  label,
  className
}) => {
  const percentage = Math.min((currentValue / targetValue) * 100, 100);
  
  const gaugeData = {
    value: currentValue,
    min: 0,
    max: targetValue,
    label,
    unit,
    thresholds: [
      { value: targetValue * 0.3, color: '#ef4444', label: '需要努力' },
      { value: targetValue * 0.7, color: '#f59e0b', label: '进展良好' },
      { value: targetValue, color: '#22c55e', label: '目标达成' }
    ]
  };

  // 简化的进度条实现
  return (
    <div className={className}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">{label}</h3>
        <p className="text-2xl font-bold text-primary">
          {chartUtils.formatValue(currentValue)} / {chartUtils.formatValue(targetValue)} {unit}
        </p>
        <p className="text-sm text-muted-foreground">
          {percentage.toFixed(1)}% 完成
        </p>
      </div>
      
      <div className="w-full bg-muted rounded-full h-4 mb-2">
        <div
          className="bg-primary h-4 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0 {unit}</span>
        <span>{chartUtils.formatValue(targetValue)} {unit}</span>
      </div>
    </div>
  );
};

/**
 * 综合统计仪表板
 */
export interface FocusStatsDashboardProps {
  dailyStats: DailyStats[];
  sessions: FocusSession[];
  goals: {
    dailyFocusTime: number; // 秒
    weeklyFocusTime: number; // 秒
    dailySessions: number;
  };
  className?: string;
}

export const FocusStatsDashboard: React.FC<FocusStatsDashboardProps> = ({
  dailyStats,
  sessions,
  goals,
  className
}) => {
  const todayStats = dailyStats[dailyStats.length - 1];
  const weekStats = dailyStats.slice(-7);
  const weeklyFocusTime = weekStats.reduce((sum, stat) => sum + stat.totalFocusTime, 0);

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 今日专注时间进度 */}
        <FocusGoalProgress
          currentValue={todayStats?.totalFocusTime || 0}
          targetValue={goals.dailyFocusTime}
          unit="小时"
          label="今日专注时间"
        />

        {/* 本周专注时间进度 */}
        <FocusGoalProgress
          currentValue={weeklyFocusTime}
          targetValue={goals.weeklyFocusTime}
          unit="小时"
          label="本周专注时间"
        />

        {/* 今日会话数进度 */}
        <FocusGoalProgress
          currentValue={todayStats?.sessionsCount || 0}
          targetValue={goals.dailySessions}
          unit="次"
          label="今日会话数"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* 专注时间趋势 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">专注时间趋势</h3>
          <FocusTimeTrend
            data={dailyStats.slice(-7)}
            timeRange="week"
            showBreakTime={true}
          />
        </div>

        {/* 效率分布 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">效率分布</h3>
          <EfficiencyDistribution data={sessions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* 专注类型分布 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">时间分布</h3>
          <FocusTypeDistribution data={sessions} />
        </div>

        {/* 今日会话分布 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">今日会话分布</h3>
          <DailySessionDistribution
            data={sessions}
            date={new Date()}
          />
        </div>
      </div>
    </div>
  );
};

export default {
  FocusTimeTrend,
  EfficiencyDistribution,
  DailySessionDistribution,
  FocusTypeDistribution,
  WeeklyEfficiencyHeatmap,
  FocusGoalProgress,
  FocusStatsDashboard
};