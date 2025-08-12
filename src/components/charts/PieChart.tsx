/**
 * 饼图组件
 * 基于Recharts构建的高性能饼图
 */

import React, { useMemo, useCallback, useState } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector
} from 'recharts';
import { BaseChart, chartUtils } from './BaseChart';
import { PieChartProps, PieChartData } from '../../types/charts';
import { cn } from '../../utils/cn';

/**
 * 自定义工具提示组件
 */
const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as PieChartData;

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <span className="text-sm font-medium text-popover-foreground">
          {data.label}
        </span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">数值:</span>
          <span className="font-medium text-popover-foreground">
            {chartUtils.formatValue(data.value)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">占比:</span>
          <span className="font-medium text-popover-foreground">
            {data.percentage?.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * 自定义标签组件
 */
const CustomLabel: React.FC<any> = ({ 
  cx, cy, midAngle, innerRadius, outerRadius, value, label, percentage, 
  showLabels, showValues, showPercentages, labelPosition 
}) => {
  if (!showLabels && !showValues && !showPercentages) return null;

  const RADIAN = Math.PI / 180;
  const radius = labelPosition === 'inside' 
    ? innerRadius + (outerRadius - innerRadius) * 0.5
    : outerRadius + 30;
  
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  let displayText = '';
  if (showLabels) displayText += label;
  if (showValues) displayText += (displayText ? ': ' : '') + chartUtils.formatValue(value);
  if (showPercentages) displayText += (displayText ? ' (' : '') + percentage.toFixed(1) + '%' + (displayText.includes(':') ? ')' : '');

  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs fill-foreground"
    >
      {displayText}
    </text>
  );
};

/**
 * 活跃扇形组件（用于悬停效果）
 */
const ActiveShape: React.FC<any> = (props) => {
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload
  } = props;

  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="currentColor"
        className="text-sm font-medium fill-foreground"
      >
        {payload.label}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="currentColor"
        className="text-xs fill-muted-foreground"
      >
        {`${chartUtils.formatValue(payload.value)} (${payload.percentage.toFixed(1)}%)`}
      </text>
    </g>
  );
};

/**
 * 饼图组件
 */
export const PieChart: React.FC<PieChartProps> = ({
  data,
  config,
  innerRadius = 0,
  outerRadius,
  startAngle = 0,
  endAngle = 360,
  showLabels = true,
  showValues = false,
  showPercentages = true,
  labelPosition = 'outside',
  tooltip,
  events,
  loading,
  error,
  className
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // 计算百分比和处理数据
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return data.map((item, index) => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0,
      color: item.color || undefined // 让主题系统处理颜色
    }));
  }, [data]);

  // 处理扇形点击
  const handleSliceClick = useCallback((data: PieChartData, index: number) => {
    events?.onSliceClick?.(data);
  }, [events]);

  // 处理扇形悬停
  const handleSliceHover = useCallback((data: PieChartData, index: number) => {
    setActiveIndex(index);
    events?.onSliceHover?.(data);
  }, [events]);

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    setActiveIndex(-1);
  }, []);

  // 计算半径
  const calculatedOuterRadius = outerRadius || Math.min(200, 150);
  const calculatedInnerRadius = innerRadius;

  return (
    <BaseChart
      data={[]} // 饼图不使用series格式
      config={config}
      loading={loading}
      error={error}
      className={className}
    >
      {({ width, height, theme }) => (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={labelPosition !== 'inside' ? (props) => (
                <CustomLabel
                  {...props}
                  showLabels={showLabels}
                  showValues={showValues}
                  showPercentages={showPercentages}
                  labelPosition={labelPosition}
                />
              ) : false}
              outerRadius={calculatedOuterRadius}
              innerRadius={calculatedInnerRadius}
              startAngle={startAngle}
              endAngle={endAngle}
              fill="#8884d8"
              dataKey="value"
              onClick={handleSliceClick}
              onMouseEnter={handleSliceHover}
              onMouseLeave={handleMouseLeave}
              activeIndex={activeIndex}
              activeShape={<ActiveShape />}
              animationDuration={config?.animation?.enabled ? config.animation.duration : 0}
            >
              {processedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || theme.colors?.[index % (theme.colors?.length || 1)]}
                  stroke={theme.backgroundColor}
                  strokeWidth={2}
                />
              ))}
              
              {/* 内部标签 */}
              {labelPosition === 'inside' && (showLabels || showValues || showPercentages) && (
                processedData.map((entry, index) => {
                  const angle = startAngle + (endAngle - startAngle) * (index + 0.5) / processedData.length;
                  const RADIAN = Math.PI / 180;
                  const radius = calculatedInnerRadius + (calculatedOuterRadius - calculatedInnerRadius) * 0.5;
                  const x = Math.cos(-angle * RADIAN) * radius;
                  const y = Math.sin(-angle * RADIAN) * radius;
                  
                  let displayText = '';
                  if (showLabels) displayText += entry.label;
                  if (showValues) displayText += (displayText ? ': ' : '') + chartUtils.formatValue(entry.value);
                  if (showPercentages) displayText += (displayText ? ' (' : '') + entry.percentage.toFixed(1) + '%' + (displayText.includes(':') ? ')' : '');
                  
                  return (
                    <text
                      key={`label-${index}`}
                      x={x}
                      y={y}
                      fill="white"
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-xs font-medium"
                    >
                      {displayText}
                    </text>
                  );
                })
              )}
            </Pie>

            {/* 工具提示 */}
            {tooltip?.show !== false && (
              <Tooltip content={<CustomTooltip />} />
            )}

            {/* 图例 */}
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px'
              }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      )}
    </BaseChart>
  );
};

/**
 * 环形图组件
 */
export const DonutChart: React.FC<Omit<PieChartProps, 'innerRadius'> & { innerRadius?: number }> = ({
  innerRadius = 60,
  ...props
}) => {
  return <PieChart {...props} innerRadius={innerRadius} />;
};

/**
 * 半圆饼图组件
 */
export const SemiCirclePieChart: React.FC<Omit<PieChartProps, 'startAngle' | 'endAngle'>> = (props) => {
  return <PieChart {...props} startAngle={180} endAngle={0} />;
};

export default PieChart;