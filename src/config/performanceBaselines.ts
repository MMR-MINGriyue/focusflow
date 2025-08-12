/**
 * 性能基准配置
 * 
 * 定义各种性能指标的基准值和阈值
 */

export interface PerformanceBaseline {
  /** 目标值（理想性能） */
  target: number;
  /** 警告阈值 */
  warning: number;
  /** 关键阈值 */
  critical: number;
  /** 单位 */
  unit: string;
  /** 描述 */
  description: string;
}

export interface ComponentBaseline {
  /** 组件名称 */
  name: string;
  /** 渲染时间基准 */
  renderTime: PerformanceBaseline;
  /** 内存使用基准 */
  memoryUsage: PerformanceBaseline;
  /** 更新频率基准 */
  updateFrequency: PerformanceBaseline;
}

// 全局性能基准
export const GLOBAL_PERFORMANCE_BASELINES = {
  // 渲染性能
  renderTime: {
    target: 16,
    warning: 20,
    critical: 32,
    unit: 'ms',
    description: '组件渲染时间，目标60FPS'
  } as PerformanceBaseline,

  // 内存使用
  memoryUsage: {
    target: 20,
    warning: 50,
    critical: 100,
    unit: 'MB',
    description: '应用内存使用量'
  } as PerformanceBaseline,

  // 交互延迟
  interactionDelay: {
    target: 100,
    warning: 200,
    critical: 500,
    unit: 'ms',
    description: '用户交互响应时间'
  } as PerformanceBaseline,

  // 帧率
  fps: {
    target: 60,
    warning: 45,
    critical: 30,
    unit: 'fps',
    description: '动画和滚动帧率'
  } as PerformanceBaseline,

  // 包大小
  bundleSize: {
    target: 500,
    warning: 1000,
    critical: 2000,
    unit: 'KB',
    description: 'JavaScript包大小'
  } as PerformanceBaseline,

  // 网络延迟
  networkLatency: {
    target: 200,
    warning: 500,
    critical: 1000,
    unit: 'ms',
    description: '网络请求延迟'
  } as PerformanceBaseline,

  // DOM节点数量
  domNodes: {
    target: 500,
    warning: 1000,
    critical: 2000,
    unit: 'nodes',
    description: 'DOM节点总数'
  } as PerformanceBaseline,

  // 事件监听器数量
  eventListeners: {
    target: 50,
    warning: 100,
    critical: 200,
    unit: 'listeners',
    description: '活跃事件监听器数量'
  } as PerformanceBaseline
};

// 组件级性能基准
export const COMPONENT_BASELINES: ComponentBaseline[] = [
  {
    name: 'TimerDisplay',
    renderTime: {
      target: 8,
      warning: 12,
      critical: 16,
      unit: 'ms',
      description: 'TimerDisplay组件渲染时间'
    },
    memoryUsage: {
      target: 2,
      warning: 5,
      critical: 10,
      unit: 'MB',
      description: 'TimerDisplay组件内存使用'
    },
    updateFrequency: {
      target: 1,
      warning: 5,
      critical: 10,
      unit: 'updates/sec',
      description: 'TimerDisplay组件更新频率'
    }
  },
  {
    name: 'Settings',
    renderTime: {
      target: 10,
      warning: 15,
      critical: 20,
      unit: 'ms',
      description: 'Settings组件渲染时间'
    },
    memoryUsage: {
      target: 1,
      warning: 3,
      critical: 5,
      unit: 'MB',
      description: 'Settings组件内存使用'
    },
    updateFrequency: {
      target: 0.1,
      warning: 0.5,
      critical: 1,
      unit: 'updates/sec',
      description: 'Settings组件更新频率'
    }
  },
  {
    name: 'BackgroundEffects',
    renderTime: {
      target: 5,
      warning: 8,
      critical: 12,
      unit: 'ms',
      description: 'BackgroundEffects组件渲染时间'
    },
    memoryUsage: {
      target: 3,
      warning: 8,
      critical: 15,
      unit: 'MB',
      description: 'BackgroundEffects组件内存使用'
    },
    updateFrequency: {
      target: 60,
      warning: 30,
      critical: 15,
      unit: 'updates/sec',
      description: 'BackgroundEffects动画帧率'
    }
  }
];

// 性能测试配置
export const PERFORMANCE_TEST_CONFIG = {
  // 基准测试配置
  benchmark: {
    iterations: 10,
    warmupIterations: 3,
    timeout: 30000,
    sampleSize: 100
  },

  // 回归测试配置
  regression: {
    iterations: 20,
    loadTestIterations: 50,
    memoryCheckInterval: 1000,
    maxRegressionPercent: 10 // 最大性能退化百分比
  },

  // 压力测试配置
  stress: {
    duration: 60000, // 1分钟
    concurrency: 10,
    rampUpTime: 5000, // 5秒
    memoryLimit: 200 // MB
  },

  // 监控配置
  monitoring: {
    sampleInterval: 1000, // 1秒
    reportInterval: 10000, // 10秒
    retentionTime: 3600000, // 1小时
    alertThreshold: 0.8 // 80%阈值触发警报
  }
};

// 性能等级定义
export const PERFORMANCE_GRADES = {
  EXCELLENT: {
    score: 90,
    label: '优秀',
    color: '#10b981',
    description: '性能表现优秀，用户体验极佳'
  },
  GOOD: {
    score: 75,
    label: '良好',
    color: '#3b82f6',
    description: '性能表现良好，用户体验流畅'
  },
  FAIR: {
    score: 60,
    label: '一般',
    color: '#f59e0b',
    description: '性能表现一般，有优化空间'
  },
  POOR: {
    score: 40,
    label: '较差',
    color: '#ef4444',
    description: '性能表现较差，需要优化'
  },
  CRITICAL: {
    score: 0,
    label: '严重',
    color: '#dc2626',
    description: '性能严重问题，影响用户体验'
  }
};

// 设备性能分级
export const DEVICE_PERFORMANCE_TIERS = {
  HIGH_END: {
    name: '高端设备',
    criteria: {
      memory: 8, // GB
      cores: 8,
      gpu: 'dedicated'
    },
    baselines: {
      renderTime: 8, // ms
      memoryUsage: 30, // MB
      fps: 60
    }
  },
  MID_RANGE: {
    name: '中端设备',
    criteria: {
      memory: 4, // GB
      cores: 4,
      gpu: 'integrated'
    },
    baselines: {
      renderTime: 12, // ms
      memoryUsage: 40, // MB
      fps: 45
    }
  },
  LOW_END: {
    name: '低端设备',
    criteria: {
      memory: 2, // GB
      cores: 2,
      gpu: 'basic'
    },
    baselines: {
      renderTime: 16, // ms
      memoryUsage: 50, // MB
      fps: 30
    }
  }
};

// 性能优化建议
export const PERFORMANCE_RECOMMENDATIONS = {
  renderTime: {
    target: [
      '使用React.memo优化组件渲染',
      '实施虚拟化处理大列表',
      '优化CSS选择器和样式计算'
    ],
    warning: [
      '检查不必要的重新渲染',
      '优化组件更新逻辑',
      '使用useMemo缓存计算结果'
    ],
    critical: [
      '立即检查渲染瓶颈',
      '分析组件渲染树',
      '考虑代码分割和懒加载'
    ]
  },
  memoryUsage: {
    target: [
      '定期清理缓存数据',
      '优化图片和资源加载',
      '使用对象池减少GC压力'
    ],
    warning: [
      '检查内存泄漏',
      '优化数据结构',
      '清理未使用的变量和引用'
    ],
    critical: [
      '立即检查内存泄漏',
      '减少DOM节点数量',
      '优化大对象的使用'
    ]
  },
  interactionDelay: {
    target: [
      '使用防抖和节流优化事件',
      '预加载关键资源',
      '优化异步操作'
    ],
    warning: [
      '检查事件处理器性能',
      '优化状态更新逻辑',
      '减少同步操作'
    ],
    critical: [
      '检查阻塞操作',
      '优化关键路径',
      '考虑Web Worker'
    ]
  }
};

/**
 * 获取组件性能基准
 */
export function getComponentBaseline(componentName: string): ComponentBaseline | null {
  return COMPONENT_BASELINES.find(baseline => baseline.name === componentName) || null;
}

/**
 * 获取性能等级
 */
export function getPerformanceGrade(score: number) {
  if (score >= PERFORMANCE_GRADES.EXCELLENT.score) return PERFORMANCE_GRADES.EXCELLENT;
  if (score >= PERFORMANCE_GRADES.GOOD.score) return PERFORMANCE_GRADES.GOOD;
  if (score >= PERFORMANCE_GRADES.FAIR.score) return PERFORMANCE_GRADES.FAIR;
  if (score >= PERFORMANCE_GRADES.POOR.score) return PERFORMANCE_GRADES.POOR;
  return PERFORMANCE_GRADES.CRITICAL;
}

/**
 * 检查性能指标状态
 */
export function checkPerformanceStatus(
  metricName: keyof typeof GLOBAL_PERFORMANCE_BASELINES,
  value: number
): 'good' | 'warning' | 'critical' {
  const baseline = GLOBAL_PERFORMANCE_BASELINES[metricName];
  if (!baseline) return 'good';

  if (value <= baseline.target) return 'good';
  if (value <= baseline.warning) return 'warning';
  return 'critical';
}

/**
 * 获取性能优化建议
 */
export function getPerformanceRecommendations(
  metricName: keyof typeof PERFORMANCE_RECOMMENDATIONS,
  status: 'target' | 'warning' | 'critical'
): string[] {
  const recommendations = PERFORMANCE_RECOMMENDATIONS[metricName];
  if (!recommendations) return [];

  return recommendations[status] || [];
}
