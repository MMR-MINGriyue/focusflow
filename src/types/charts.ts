/**
 * 图表组件类型定义
 * 定义图表相关的类型和接口
 */

// 图表数据点
export interface ChartDataPoint {
  x: number | string | Date;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

// 图表数据系列
export interface ChartSeries {
  id: string;
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area' | 'scatter';
  visible?: boolean;
  strokeWidth?: number;
  fillOpacity?: number;
}

// 图表配置
export interface ChartConfig {
  width?: number;
  height?: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  animation?: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
  theme?: 'light' | 'dark' | 'auto';
}

// 轴配置
export interface AxisConfig {
  show?: boolean;
  label?: string;
  tickCount?: number;
  tickFormat?: (value: any) => string;
  domain?: [number, number] | 'auto';
  type?: 'linear' | 'time' | 'category';
  grid?: boolean;
  gridColor?: string;
  axisColor?: string;
  tickColor?: string;
  labelColor?: string;
}

// 图例配置
export interface LegendConfig {
  show?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  itemSpacing?: number;
  symbolSize?: number;
  onClick?: (series: ChartSeries) => void;
}

// 工具提示配置
export interface TooltipConfig {
  show?: boolean;
  trigger?: 'hover' | 'click';
  formatter?: (data: ChartDataPoint, series: ChartSeries) => string | React.ReactNode;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  borderRadius?: number;
  padding?: number;
  followCursor?: boolean;
}

// 缩放配置
export interface ZoomConfig {
  enabled?: boolean;
  type?: 'x' | 'y' | 'xy';
  wheelSensitivity?: number;
  panEnabled?: boolean;
  resetButton?: boolean;
}

// 图表事件
export interface ChartEvents {
  onDataPointClick?: (data: ChartDataPoint, series: ChartSeries) => void;
  onDataPointHover?: (data: ChartDataPoint, series: ChartSeries) => void;
  onSeriesToggle?: (series: ChartSeries) => void;
  onZoom?: (domain: { x?: [number, number]; y?: [number, number] }) => void;
  onBrush?: (selection: { x?: [number, number]; y?: [number, number] }) => void;
}

// 完整的图表属性
export interface ChartProps {
  data: ChartSeries[];
  config?: ChartConfig;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  zoom?: ZoomConfig;
  events?: ChartEvents;
  loading?: boolean;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
}

// 线图特定属性
export interface LineChartProps extends ChartProps {
  smooth?: boolean;
  strokeWidth?: number;
  showPoints?: boolean;
  pointSize?: number;
  connectNulls?: boolean;
}

// 柱状图特定属性
export interface BarChartProps extends ChartProps {
  barWidth?: number;
  barSpacing?: number;
  stacked?: boolean;
  horizontal?: boolean;
  borderRadius?: number;
}

// 面积图特定属性
export interface AreaChartProps extends ChartProps {
  stacked?: boolean;
  fillOpacity?: number;
  baseline?: number | 'zero' | 'wiggle' | 'silhouette';
}

// 饼图数据
export interface PieChartData {
  id: string;
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

// 饼图属性
export interface PieChartProps {
  data: PieChartData[];
  config?: ChartConfig;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  showLabels?: boolean;
  showValues?: boolean;
  showPercentages?: boolean;
  labelPosition?: 'inside' | 'outside';
  tooltip?: TooltipConfig;
  events?: {
    onSliceClick?: (data: PieChartData) => void;
    onSliceHover?: (data: PieChartData) => void;
  };
  loading?: boolean;
  error?: string;
  className?: string;
}

// 热力图数据
export interface HeatmapData {
  x: number | string;
  y: number | string;
  value: number;
  label?: string;
}

// 热力图属性
export interface HeatmapProps {
  data: HeatmapData[];
  config?: ChartConfig;
  colorScale?: string[];
  cellSize?: number;
  cellSpacing?: number;
  showValues?: boolean;
  valueFormat?: (value: number) => string;
  tooltip?: TooltipConfig;
  events?: {
    onCellClick?: (data: HeatmapData) => void;
    onCellHover?: (data: HeatmapData) => void;
  };
  loading?: boolean;
  error?: string;
  className?: string;
}

// 仪表盘数据
export interface GaugeData {
  value: number;
  min: number;
  max: number;
  label?: string;
  unit?: string;
  thresholds?: Array<{
    value: number;
    color: string;
    label?: string;
  }>;
}

// 仪表盘属性
export interface GaugeProps {
  data: GaugeData;
  config?: ChartConfig;
  startAngle?: number;
  endAngle?: number;
  thickness?: number;
  showValue?: boolean;
  showLabel?: boolean;
  showThresholds?: boolean;
  valueFormat?: (value: number) => string;
  colors?: string[];
  className?: string;
}

// 图表性能配置
export interface ChartPerformanceConfig {
  virtualScrolling?: boolean;
  dataThrottling?: boolean;
  renderThrottling?: boolean;
  maxDataPoints?: number;
  updateStrategy?: 'immediate' | 'debounced' | 'throttled';
  updateDelay?: number;
  enableWebGL?: boolean;
  enableCanvas?: boolean;
}

// 图表导出配置
export interface ChartExportConfig {
  formats?: ('png' | 'jpg' | 'svg' | 'pdf')[];
  filename?: string;
  quality?: number;
  scale?: number;
  backgroundColor?: string;
}

// 图表主题
export interface ChartTheme {
  backgroundColor?: string;
  textColor?: string;
  gridColor?: string;
  axisColor?: string;
  colors?: string[];
  fontFamily?: string;
  fontSize?: number;
}

export default ChartProps;