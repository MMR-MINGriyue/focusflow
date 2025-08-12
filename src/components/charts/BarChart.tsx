/**
 * 柱状图组件
 * 基于Recharts构建的高性能柱状图
 */

import React, { useMemo, useCallback } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { BaseChart, chartUtils } from './BaseChart';
import { BarChartProps } from '../../types/charts';
import { cn } from '../../utils/cn';

// 默认柱状图配置
const DEFAULT_BAR_CONFIG = {
  barWidth: undefined,
  barSpacing: 4,
  stacked: false,
  horizontal: false,
  borderRadius: 0
};

/**
 * 自定义工具提示组件
 */
const CustomTooltip: React.FC<any> = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 max-w-xs">
      <p className="text-sm font-medium text-popover-foreground mb-2">
        {typeof label === 'string' ? label : chartUtils.formatTime(label)}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.dataKey}:</span>
          <span className="font-medium text-popover-foreground">
            {formatter ? formatter(entry.value, entry.dataKey) : chartUtils.formatValue(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * 自定义标签组件
 */
const CustomLabel: React.FC<any> = ({ x, y, width, height, value, position = 'top' }) => {
  if (!value || value === 0) return null;

  let labelX = x + width / 2;
  let labelY = y;

  switch (position) {
    case 'top':
      labelY = y - 5;
      break;
    case 'middle':
      labelY = y + height / 2;
      break;
    case 'bottom':
      labelY = y + height + 15;
      break;
  }

  return (
    <text
      x={labelX}
      y={labelY}
      fill="currentColor"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-xs fill-muted-foreground"
    >
      {chartUtils.formatValue(value)}
    </text>
  );
};

/**
 * 柱状图组件
 */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  config,
  xAxis,
  yAxis,
  legend,
  tooltip,
  events,
  barWidth = DEFAULT_BAR_CONFIG.barWidth,
  barSpacing = DEFAULT_BAR_CONFIG.barSpacing,
  stacked = DEFAULT_BAR_CONFIG.stacked,
  horizontal = DEFAULT_BAR_CONFIG.horizontal,
  borderRadius = DEFAULT_BAR_CONFIG.borderRadius,
  loading,
  error,
  className,
  style
}) => {
  // 转换数据格式为Recharts格式
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // 获取所有唯一的x值
    const xValues = new Set<string>();
    data.forEach(series => {
      series.data.forEach(point => {
        xValues.add(String(point.x));
      });
    });

    // 转换为Recharts格式
    return Array.from(xValues).sort().map(xValue => {
      const dataPoint: any = { x: xValue };
      
      data.forEach(series => {
        const point = series.data.find(p => String(p.x) === xValue);
        dataPoint[series.name] = point ? point.y : 0;
      });
      
      return dataPoint;
    });
  }, [data]);

  // 处理柱子点击
  const handleBarClick = useCallback((data: any, event: any) => {
    if (!events?.onDataPointClick) return;
    
    const xValue = data.x;
    const seriesName = event.dataKey;
    const series = data.find((s: any) => s.name === seriesName);
    
    if (series) {
      const point = series.data.find((p: any) => String(p.x) === xValue);
      if (point) {
        events.onDataPointClick(point, series);
      }
    }
  }, [events, data]);

  // 自定义格式化函数
  const formatTooltip = useCallback((value: any, name: string) => {
    if (tooltip?.formatter) {
      const series = data.find(s => s.name === name);
      if (series) {
        const point = { x: '', y: value } as any;
        return tooltip.formatter(point, series);
      }
    }
    return chartUtils.formatValue(value);
  }, [tooltip, data]);

  const formatXAxisTick = useCallback((value: any) => {
    if (xAxis?.tickFormat) {
      return xAxis.tickFormat(value);
    }
    return xAxis?.type === 'time' ? chartUtils.formatTime(value) : String(value);
  }, [xAxis]);

  const formatYAxisTick = useCallback((value: any) => {
    if (yAxis?.tickFormat) {
      return yAxis.tickFormat(value);
    }
    return chartUtils.formatValue(value);
  }, [yAxis]);

  // 计算柱子颜色
  const getBarColor = useCallback((seriesIndex: number, dataIndex: number) => {
    const series = data[seriesIndex];
    if (series?.color) return series.color;
    
    // 如果是单系列且每个数据点有颜色，使用数据点颜色
    if (data.length === 1 && series?.data[dataIndex]?.color) {
      return series.data[dataIndex].color;
    }
    
    return undefined; // 使用默认主题颜色
  }, [data]);

  return (
    <BaseChart
      data={data}
      config={config}
      loading={loading}
      error={error}
      className={className}
      style={style}
    >
      {({ width, height, theme }) => (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={chartData}
            margin={config?.margin}
            layout={horizontal ? 'horizontal' : 'vertical'}
            onClick={handleBarClick}
            barCategoryGap={barSpacing}
          >
            {/* 网格 */}
            {(xAxis?.grid !== false || yAxis?.grid !== false) && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.gridColor}
                opacity={0.3}
                horizontal={!horizontal}
                vertical={horizontal}
              />
            )}

            {/* X轴 */}
            {xAxis?.show !== false && (
              <XAxis
                dataKey={horizontal ? undefined : "x"}
                type={horizontal ? 'number' : 'category'}
                axisLine={{ stroke: theme.axisColor }}
                tickLine={{ stroke: theme.axisColor }}
                tick={{ fill: theme.textColor, fontSize: theme.fontSize }}
                tickFormatter={horizontal ? formatYAxisTick : formatXAxisTick}
                domain={horizontal ? (yAxis?.domain === 'auto' ? undefined : yAxis?.domain) : undefined}
              />
            )}

            {/* Y轴 */}
            {yAxis?.show !== false && (
              <YAxis
                dataKey={horizontal ? "x" : undefined}
                type={horizontal ? 'category' : 'number'}
                axisLine={{ stroke: theme.axisColor }}
                tickLine={{ stroke: theme.axisColor }}
                tick={{ fill: theme.textColor, fontSize: theme.fontSize }}
                tickFormatter={horizontal ? formatXAxisTick : formatYAxisTick}
                domain={horizontal ? undefined : (yAxis?.domain === 'auto' ? undefined : yAxis?.domain)}
              />
            )}

            {/* 工具提示 */}
            {tooltip?.show !== false && (
              <Tooltip
                content={<CustomTooltip formatter={formatTooltip} />}
                cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
              />
            )}

            {/* 图例 */}
            {legend?.show !== false && data.length > 1 && (
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
              />
            )}

            {/* 数据柱 */}
            {data.map((series, seriesIndex) => (
              <Bar
                key={series.id}
                dataKey={series.name}
                fill={series.color || theme.colors?.[seriesIndex % (theme.colors?.length || 1)]}
                radius={borderRadius}
                maxBarSize={barWidth}
                stackId={stacked ? 'stack' : undefined}
                hide={series.visible === false}
                animationDuration={config?.animation?.enabled ? config.animation.duration : 0}
              >
                {/* 如果是单系列且数据点有自定义颜色 */}
                {data.length === 1 && series.data.some(point => point.color) && (
                  chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getBarColor(seriesIndex, index) || theme.colors?.[0]}
                    />
                  ))
                )}
                
                {/* 数据标签 */}
                {series.data.some(point => point.label) && (
                  <LabelList
                    content={<CustomLabel />}
                    position={horizontal ? 'right' : 'top'}
                  />
                )}
              </Bar>
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      )}
    </BaseChart>
  );
};

/**
 * 水平柱状图组件
 */
export const HorizontalBarChart: React.FC<Omit<BarChartProps, 'horizontal'>> = (props) => {
  return <BarChart {...props} horizontal={true} />;
};

/**
 * 堆叠柱状图组件
 */
export const StackedBarChart: React.FC<Omit<BarChartProps, 'stacked'>> = (props) => {
  return <BarChart {...props} stacked={true} />;
};

/**
 * 分组柱状图组件
 */
export const GroupedBarChart: React.FC<BarChartProps> = (props) => {
  return <BarChart {...props} stacked={false} />;
};

export default BarChart;