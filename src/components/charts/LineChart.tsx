/**
 * 线图组件
 * 基于Recharts构建的高性能线图
 */

import React, { useMemo, useCallback } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { BaseChart, chartUtils } from './BaseChart';
import { LineChartProps, ChartDataPoint } from '../../types/charts';
import { cn } from '../../utils/cn';

// 默认线图配置
const DEFAULT_LINE_CONFIG = {
  smooth: false,
  strokeWidth: 2,
  showPoints: true,
  pointSize: 4,
  connectNulls: false
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
            className="w-3 h-3 rounded-full"
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
 * 自定义图例组件
 */
const CustomLegend: React.FC<any> = ({ payload, onSeriesToggle }) => {
  if (!payload || !payload.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <button
          key={index}
          onClick={() => onSeriesToggle?.(entry)}
          className={cn(
            'flex items-center gap-2 text-xs transition-opacity',
            entry.inactive && 'opacity-50'
          )}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.value}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * 线图组件
 */
export const LineChart: React.FC<LineChartProps> = ({
  data,
  config,
  xAxis,
  yAxis,
  legend,
  tooltip,
  zoom,
  events,
  smooth = DEFAULT_LINE_CONFIG.smooth,
  strokeWidth = DEFAULT_LINE_CONFIG.strokeWidth,
  showPoints = DEFAULT_LINE_CONFIG.showPoints,
  pointSize = DEFAULT_LINE_CONFIG.pointSize,
  connectNulls = DEFAULT_LINE_CONFIG.connectNulls,
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
        dataPoint[series.name] = point ? point.y : null;
      });
      
      return dataPoint;
    });
  }, [data]);

  // 处理数据点点击
  const handleDataPointClick = useCallback((data: any, event: any) => {
    if (!events?.onDataPointClick) return;
    
    // 找到对应的原始数据
    const xValue = data.x;
    const seriesName = event.dataKey;
    const series = data.find((s: any) => s.name === seriesName);
    
    if (series) {
      const point = series.data.find((p: ChartDataPoint) => String(p.x) === xValue);
      if (point) {
        events.onDataPointClick(point, series);
      }
    }
  }, [events, data]);

  // 处理系列切换
  const handleSeriesToggle = useCallback((legendData: any) => {
    if (!events?.onSeriesToggle) return;
    
    const series = data.find(s => s.name === legendData.value);
    if (series) {
      events.onSeriesToggle(series);
    }
  }, [events, data]);

  // 自定义格式化函数
  const formatTooltip = useCallback((value: any, name: string) => {
    if (tooltip?.formatter) {
      const series = data.find(s => s.name === name);
      if (series) {
        const point = { x: '', y: value } as ChartDataPoint;
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
          <RechartsLineChart
            data={chartData}
            margin={config?.margin}
            onClick={handleDataPointClick}
          >
            {/* 网格 */}
            {(xAxis?.grid !== false || yAxis?.grid !== false) && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.gridColor}
                opacity={0.3}
              />
            )}

            {/* X轴 */}
            {xAxis?.show !== false && (
              <XAxis
                dataKey="x"
                axisLine={{ stroke: theme.axisColor }}
                tickLine={{ stroke: theme.axisColor }}
                tick={{ fill: theme.textColor, fontSize: theme.fontSize }}
                tickFormatter={formatXAxisTick}
                domain={xAxis?.domain === 'auto' ? undefined : xAxis?.domain}
                type={xAxis?.type === 'time' ? 'number' : 'category'}
                scale={xAxis?.type === 'time' ? 'time' : undefined}
              />
            )}

            {/* Y轴 */}
            {yAxis?.show !== false && (
              <YAxis
                axisLine={{ stroke: theme.axisColor }}
                tickLine={{ stroke: theme.axisColor }}
                tick={{ fill: theme.textColor, fontSize: theme.fontSize }}
                tickFormatter={formatYAxisTick}
                domain={yAxis?.domain === 'auto' ? undefined : yAxis?.domain}
              />
            )}

            {/* 工具提示 */}
            {tooltip?.show !== false && (
              <Tooltip
                content={<CustomTooltip formatter={formatTooltip} />}
                cursor={{ stroke: theme.colors?.[0], strokeWidth: 1, strokeDasharray: '3 3' }}
              />
            )}

            {/* 图例 */}
            {legend?.show !== false && (
              <Legend
                content={<CustomLegend onSeriesToggle={handleSeriesToggle} />}
                wrapperStyle={{ paddingTop: '20px' }}
              />
            )}

            {/* 数据线 */}
            {data.map((series, index) => (
              <Line
                key={series.id}
                type={smooth ? 'monotone' : 'linear'}
                dataKey={series.name}
                stroke={series.color || theme.colors?.[index % (theme.colors?.length || 1)]}
                strokeWidth={strokeWidth}
                dot={showPoints ? { r: pointSize, fill: series.color || theme.colors?.[index % (theme.colors?.length || 1)] } : false}
                activeDot={{ r: pointSize + 2, stroke: series.color || theme.colors?.[index % (theme.colors?.length || 1)], strokeWidth: 2 }}
                connectNulls={connectNulls}
                hide={series.visible === false}
                animationDuration={config?.animation?.enabled ? config.animation.duration : 0}
              />
            ))}

            {/* 缩放刷子 */}
            {zoom?.enabled && (
              <Brush
                dataKey="x"
                height={30}
                stroke={theme.colors?.[0]}
                fill={theme.backgroundColor}
                tickFormatter={formatXAxisTick}
              />
            )}
          </RechartsLineChart>
        </ResponsiveContainer>
      )}
    </BaseChart>
  );
};

/**
 * 面积线图组件
 */
export const AreaLineChart: React.FC<LineChartProps & { fillOpacity?: number }> = ({
  fillOpacity = 0.3,
  ...props
}) => {
  const { data, config, loading, error, className, style } = props;

  // 转换数据格式
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const xValues = new Set<string>();
    data.forEach(series => {
      series.data.forEach(point => {
        xValues.add(String(point.x));
      });
    });

    return Array.from(xValues).sort().map(xValue => {
      const dataPoint: any = { x: xValue };
      
      data.forEach(series => {
        const point = series.data.find(p => String(p.x) === xValue);
        dataPoint[series.name] = point ? point.y : null;
      });
      
      return dataPoint;
    });
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
          <ComposedChart data={chartData} margin={config?.margin}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} opacity={0.3} />
            <XAxis
              dataKey="x"
              axisLine={{ stroke: theme.axisColor }}
              tickLine={{ stroke: theme.axisColor }}
              tick={{ fill: theme.textColor, fontSize: theme.fontSize }}
            />
            <YAxis
              axisLine={{ stroke: theme.axisColor }}
              tickLine={{ stroke: theme.axisColor }}
              tick={{ fill: theme.textColor, fontSize: theme.fontSize }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {data.map((series, index) => (
              <Area
                key={series.id}
                type="monotone"
                dataKey={series.name}
                stroke={series.color || theme.colors?.[index % (theme.colors?.length || 1)]}
                fill={series.color || theme.colors?.[index % (theme.colors?.length || 1)]}
                fillOpacity={fillOpacity}
                strokeWidth={2}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </BaseChart>
  );
};

export default LineChart;