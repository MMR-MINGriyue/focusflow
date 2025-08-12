import React, { useMemo } from 'react';
import { UnifiedTimerStateType } from '../../types/unifiedTimer';

export interface StatusIndicatorProps {
  status: UnifiedTimerStateType;
  isActive?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'dot' | 'badge' | 'pill' | 'ring';
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

// 状态配置
const STATUS_CONFIG = {
  focus: {
    color: 'bg-blue-500 text-blue-50',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    lightBg: 'bg-blue-50 dark:bg-blue-900/20',
    text: '专注',
    ariaLabel: '专注状态'
  },
  break: {
    color: 'bg-green-500 text-green-50',
    borderColor: 'border-green-500',
    textColor: 'text-green-600 dark:text-green-400',
    lightBg: 'bg-green-50 dark:bg-green-900/20',
    text: '休息',
    ariaLabel: '休息状态'
  },
  microBreak: {
    color: 'bg-yellow-500 text-yellow-50',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    lightBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: '微休息',
    ariaLabel: '微休息状态'
  },
  forcedBreak: {
    color: 'bg-red-500 text-red-50',
    borderColor: 'border-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    lightBg: 'bg-red-50 dark:bg-red-900/20',
    text: '强制休息',
    ariaLabel: '强制休息状态'
  }
} as const;

// 尺寸配置
const SIZE_CONFIG = {
  small: {
    dot: 'w-2 h-2',
    badge: 'px-2 py-1 text-xs',
    pill: 'px-3 py-1 text-xs',
    ring: 'w-4 h-4',
    text: 'text-xs'
  },
  medium: {
    dot: 'w-3 h-3',
    badge: 'px-3 py-1 text-sm',
    pill: 'px-4 py-2 text-sm',
    ring: 'w-6 h-6',
    text: 'text-sm'
  },
  large: {
    dot: 'w-4 h-4',
    badge: 'px-4 py-2 text-base',
    pill: 'px-6 py-3 text-base',
    ring: 'w-8 h-8',
    text: 'text-base'
  }
} as const;

/**
 * 点状指示器
 */
const DotIndicator: React.FC<{
  config: typeof STATUS_CONFIG[UnifiedTimerStateType];
  sizeConfig: typeof SIZE_CONFIG[keyof typeof SIZE_CONFIG];
  isActive: boolean;
  animated: boolean;
  className: string;
}> = ({ config, sizeConfig, isActive, animated, className }) => (
  <div
    className={`
      ${sizeConfig.dot}
      ${config.color}
      rounded-full
      ${isActive && animated ? 'animate-pulse' : ''}
      ${animated ? 'transition-all duration-300' : ''}
      ${className}
    `}
    role="status"
    aria-label={config.ariaLabel}
  />
);

/**
 * 徽章指示器
 */
const BadgeIndicator: React.FC<{
  config: typeof STATUS_CONFIG[UnifiedTimerStateType];
  sizeConfig: typeof SIZE_CONFIG[keyof typeof SIZE_CONFIG];
  isActive: boolean;
  animated: boolean;
  showText: boolean;
  className: string;
}> = ({ config, sizeConfig, isActive, animated, showText, className }) => (
  <div
    className={`
      ${sizeConfig.badge}
      ${config.color}
      rounded-md
      font-medium
      inline-flex items-center justify-center
      ${isActive && animated ? 'animate-pulse' : ''}
      ${animated ? 'transition-all duration-300' : ''}
      ${className}
    `}
    role="status"
    aria-label={config.ariaLabel}
  >
    {showText && config.text}
  </div>
);

/**
 * 药丸指示器
 */
const PillIndicator: React.FC<{
  config: typeof STATUS_CONFIG[UnifiedTimerStateType];
  sizeConfig: typeof SIZE_CONFIG[keyof typeof SIZE_CONFIG];
  isActive: boolean;
  animated: boolean;
  showText: boolean;
  className: string;
}> = ({ config, sizeConfig, isActive, animated, showText, className }) => (
  <div
    className={`
      ${sizeConfig.pill}
      ${config.lightBg}
      ${config.textColor}
      rounded-full
      font-medium
      inline-flex items-center justify-center
      border-2 ${config.borderColor}
      ${isActive && animated ? 'animate-pulse' : ''}
      ${animated ? 'transition-all duration-300' : ''}
      ${className}
    `}
    role="status"
    aria-label={config.ariaLabel}
  >
    {showText && config.text}
  </div>
);

/**
 * 环形指示器
 */
const RingIndicator: React.FC<{
  config: typeof STATUS_CONFIG[UnifiedTimerStateType];
  sizeConfig: typeof SIZE_CONFIG[keyof typeof SIZE_CONFIG];
  isActive: boolean;
  animated: boolean;
  className: string;
}> = ({ config, sizeConfig, isActive, animated, className }) => (
  <div
    className={`
      ${sizeConfig.ring}
      rounded-full
      border-2 ${config.borderColor}
      ${config.lightBg}
      relative
      ${animated ? 'transition-all duration-300' : ''}
      ${className}
    `}
    role="status"
    aria-label={config.ariaLabel}
  >
    <div
      className={`
        absolute inset-1
        ${config.color}
        rounded-full
        ${isActive && animated ? 'animate-ping' : ''}
      `}
    />
  </div>
);

/**
 * 状态指示器组件
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = React.memo(({
  status,
  isActive = false,
  size = 'medium',
  variant = 'dot',
  showText = false,
  animated = true,
  className = ''
}) => {
  const config = useMemo(() => STATUS_CONFIG[status], [status]);
  const sizeConfig = useMemo(() => SIZE_CONFIG[size], [size]);

  const commonProps = {
    config,
    sizeConfig,
    isActive,
    animated,
    className
  };

  switch (variant) {
    case 'badge':
      return <BadgeIndicator {...commonProps} showText={showText} />;
    case 'pill':
      return <PillIndicator {...commonProps} showText={showText} />;
    case 'ring':
      return <RingIndicator {...commonProps} />;
    default:
      return <DotIndicator {...commonProps} />;
  }
});

StatusIndicator.displayName = 'StatusIndicator';

export default StatusIndicator;