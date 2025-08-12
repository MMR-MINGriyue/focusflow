import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/OptimizedTooltip';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Square,
  FastForward,
  Rewind,
  Keyboard
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

export interface TimerControlsProps {
  isActive: boolean;
  currentState?: 'focus' | 'break' | 'longBreak' | 'microBreak';
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip?: () => void;
  onStop?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal' | 'floating';
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  showTooltips?: boolean;
  disabled?: boolean;
  keyboardShortcuts?: boolean;
  showKeyboardHelp?: boolean;
  touchFriendly?: boolean;
  loading?: boolean;
}

// 按钮配置
const BUTTON_CONFIG = {
  start: {
    icon: Play,
    label: '开始',
    tooltip: '开始计时器',
    shortcut: '空格键',
    variant: 'primary' as const,
    ariaLabel: '开始计时器，快捷键空格键'
  },
  pause: {
    icon: Pause,
    label: '暂停',
    tooltip: '暂停计时器',
    shortcut: '空格键',
    variant: 'secondary' as const,
    ariaLabel: '暂停计时器，快捷键空格键'
  },
  reset: {
    icon: RotateCcw,
    label: '重置',
    tooltip: '重置计时器',
    shortcut: 'R',
    variant: 'outline' as const,
    ariaLabel: '重置计时器，快捷键R'
  },
  skip: {
    icon: SkipForward,
    label: '跳过',
    tooltip: '跳过当前阶段',
    shortcut: 'S',
    variant: 'outline' as const,
    ariaLabel: '跳过当前阶段，快捷键S'
  },
  stop: {
    icon: Square,
    label: '停止',
    tooltip: '停止计时器',
    shortcut: 'Esc',
    variant: 'destructive' as const,
    ariaLabel: '停止计时器，快捷键Esc'
  }
} as const;

// 尺寸配置
const SIZE_CONFIG = {
  small: {
    buttonSize: 'sm' as const,
    iconSize: 'w-4 h-4',
    spacing: 'gap-2',
    padding: 'px-3 py-2',
    minTouchTarget: 'min-h-[44px] min-w-[44px]' // 触摸友好
  },
  medium: {
    buttonSize: 'default' as const,
    iconSize: 'w-5 h-5',
    spacing: 'gap-3',
    padding: 'px-4 py-2',
    minTouchTarget: 'min-h-[48px] min-w-[48px]'
  },
  large: {
    buttonSize: 'lg' as const,
    iconSize: 'w-6 h-6',
    spacing: 'gap-4',
    padding: 'px-6 py-3',
    minTouchTarget: 'min-h-[52px] min-w-[52px]'
  }
} as const;

// 变体配置
const VARIANT_CONFIG = {
  default: {
    containerClass: 'flex items-center justify-center flex-wrap',
    buttonSpacing: 'gap-3',
    background: 'bg-transparent'
  },
  compact: {
    containerClass: 'flex items-center justify-center',
    buttonSpacing: 'gap-2',
    background: 'bg-transparent'
  },
  minimal: {
    containerClass: 'flex items-center justify-center',
    buttonSpacing: 'gap-1',
    background: 'bg-transparent'
  },
  floating: {
    containerClass: 'fixed bottom-6 right-6 z-50 flex items-center rounded-full shadow-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-3',
    buttonSpacing: 'gap-2',
    background: 'bg-white/90 dark:bg-gray-800/90'
  }
} as const;

// 键盘帮助组件
const KeyboardHelp: React.FC<{ 
  show: boolean; 
  onClose: () => void;
  shortcuts: Array<{ key: string; action: string; }>;
}> = ({ show, onClose, shortcuts }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[200px]"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            键盘快捷键
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="关闭快捷键帮助"
          >
            ×
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map(({ key, action }) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{action}</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

/**
 * 计时器控制按钮组件
 */
export const TimerControls: React.FC<TimerControlsProps> = React.memo(({
  isActive,
  currentState,
  onStart,
  onPause,
  onReset,
  onSkip,
  onStop,
  className = '',
  variant = 'default',
  size = 'medium',
  showLabels = true,
  showTooltips = true,
  disabled = false,
  keyboardShortcuts = true,
  showKeyboardHelp = false,
  touchFriendly = true,
  loading = false
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  
  const sizeConfig = useMemo(() => SIZE_CONFIG[size], [size]);
  const variantConfig = useMemo(() => VARIANT_CONFIG[variant], [variant]);

  // 缓存按钮点击处理函数
  const handleStart = useCallback(() => {
    if (!disabled && !loading) onStart();
  }, [disabled, loading, onStart]);

  const handlePause = useCallback(() => {
    if (!disabled && !loading) onPause();
  }, [disabled, loading, onPause]);

  const handleReset = useCallback(() => {
    if (!disabled && !loading) onReset();
  }, [disabled, loading, onReset]);

  const handleSkip = useCallback(() => {
    if (!disabled && !loading && onSkip) onSkip();
  }, [disabled, loading, onSkip]);

  const handleStop = useCallback(() => {
    if (!disabled && !loading && onStop) onStop();
  }, [disabled, loading, onStop]);

  // 全局键盘事件处理
  useEffect(() => {
    if (!keyboardShortcuts || disabled || loading) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // 避免在输入框中触发快捷键
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      let handled = false;
      
      switch (event.key) {
        case ' ':
          event.preventDefault();
          setPressedKey('Space');
          if (isActive) {
            handlePause();
          } else {
            handleStart();
          }
          handled = true;
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          setPressedKey('R');
          handleReset();
          handled = true;
          break;
        case 's':
        case 'S':
          if (onSkip) {
            event.preventDefault();
            setPressedKey('S');
            handleSkip();
            handled = true;
          }
          break;
        case 'Escape':
          if (onStop) {
            event.preventDefault();
            setPressedKey('Esc');
            handleStop();
            handled = true;
          }
          break;
        case '?':
          if (showKeyboardHelp) {
            event.preventDefault();
            setShowHelp(!showHelp);
            handled = true;
          }
          break;
      }

      if (handled) {
        // 清除按键状态
        setTimeout(() => setPressedKey(null), 150);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcuts, disabled, loading, isActive, handlePause, handleStart, handleReset, handleSkip, handleStop, onSkip, onStop, showKeyboardHelp, showHelp]);

  // 渲染按钮的辅助函数
  const renderButton = useCallback((
    config: typeof BUTTON_CONFIG[keyof typeof BUTTON_CONFIG],
    onClick: () => void,
    isVisible: boolean = true,
    isPressed: boolean = false
  ) => {
    if (!isVisible) return null;

    const IconComponent = config.icon;
    const isDisabled = disabled || loading;
    
    const button = (
      <motion.div
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: touchFriendly ? 1 : 1.05 }}
        animate={isPressed ? { scale: 0.95 } : { scale: 1 }}
        transition={{ duration: 0.1 }}
      >
        <Button
          onClick={onClick}
          variant={config.variant}
          size={sizeConfig.buttonSize}
          disabled={isDisabled}
          className={cn(
            sizeConfig.padding,
            touchFriendly && sizeConfig.minTouchTarget,
            'transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2',
            isDisabled && 'opacity-50 cursor-not-allowed',
            loading && 'animate-pulse'
          )}
          aria-label={config.ariaLabel}
          aria-pressed={isActive && (config.label === '暂停')}
        >
          <span className={cn(
            'flex items-center',
            showLabels ? 'gap-2' : 'justify-center'
          )}>
            <IconComponent className={cn(
              sizeConfig.iconSize,
              loading && 'animate-spin'
            )} />
            {showLabels && (
              <span className="font-medium">
                {config.label}
              </span>
            )}
          </span>
        </Button>
      </motion.div>
    );

    if (showTooltips) {
      return (
        <Tooltip key={config.label}>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <div className="text-center">
              <p className="font-medium">{config.tooltip}</p>
              {keyboardShortcuts && (
                <p className="text-xs opacity-75 mt-1">
                  快捷键: <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                    {config.shortcut}
                  </kbd>
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  }, [sizeConfig, showLabels, showTooltips, disabled, loading, touchFriendly, keyboardShortcuts]);

  // 快捷键列表
  const shortcuts = useMemo(() => {
    const list = [
      { key: '空格', action: isActive ? '暂停' : '开始' },
      { key: 'R', action: '重置' }
    ];
    if (onSkip) list.push({ key: 'S', action: '跳过' });
    if (onStop) list.push({ key: 'Esc', action: '停止' });
    if (showKeyboardHelp) list.push({ key: '?', action: '显示帮助' });
    return list;
  }, [isActive, onSkip, onStop, showKeyboardHelp]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative">
        <motion.div 
          className={cn(
            variantConfig.containerClass,
            variantConfig.background,
            variantConfig.buttonSpacing,
            className
          )}
          role="group"
          aria-label="计时器控制按钮"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* 主要控制按钮：开始/暂停 */}
          {isActive 
            ? renderButton(
                BUTTON_CONFIG.pause, 
                handlePause, 
                true, 
                pressedKey === 'Space'
              )
            : renderButton(
                BUTTON_CONFIG.start, 
                handleStart, 
                true, 
                pressedKey === 'Space'
              )
          }

          {/* 重置按钮 */}
          {renderButton(
            BUTTON_CONFIG.reset, 
            handleReset, 
            true, 
            pressedKey === 'R'
          )}

          {/* 跳过按钮（可选） */}
          {renderButton(
            BUTTON_CONFIG.skip, 
            handleSkip, 
            !!onSkip, 
            pressedKey === 'S'
          )}

          {/* 停止按钮（可选） */}
          {renderButton(
            BUTTON_CONFIG.stop, 
            handleStop, 
            !!onStop, 
            pressedKey === 'Esc'
          )}

          {/* 键盘帮助按钮 */}
          {showKeyboardHelp && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowHelp(!showHelp)}
                  className={cn(
                    'p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                    touchFriendly && 'min-h-[44px] min-w-[44px]'
                  )}
                  aria-label="显示键盘快捷键帮助"
                >
                  <Keyboard className="w-4 h-4" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                <p>键盘快捷键帮助 (?)</p>
              </TooltipContent>
            </Tooltip>
          )}
        </motion.div>

        {/* 键盘帮助面板 */}
        {showKeyboardHelp && (
          <KeyboardHelp
            show={showHelp}
            onClose={() => setShowHelp(false)}
            shortcuts={shortcuts}
          />
        )}

        {/* 屏幕阅读器专用信息 */}
        <div className="sr-only" aria-live="polite">
          {loading && '正在处理...'}
          {pressedKey && `按下了 ${pressedKey} 键`}
        </div>
      </div>
    </TooltipProvider>
  );
});

/**
 * 浮动控制按钮组件
 * 适用于需要固定在屏幕某个位置的场景
 */
export const FloatingTimerControls: React.FC<Omit<TimerControlsProps, 'variant'>> = React.memo((props) => (
  <TimerControls 
    {...props} 
    variant="floating" 
    touchFriendly={true}
    showTooltips={true}
  />
));

/**
 * 紧凑控制按钮组件
 * 适用于空间有限的场景
 */
export const CompactTimerControls: React.FC<Omit<TimerControlsProps, 'variant' | 'showLabels'>> = React.memo((props) => (
  <TimerControls 
    {...props} 
    variant="compact" 
    showLabels={false}
    size="small"
    touchFriendly={true}
  />
));

/**
 * 极简控制按钮组件
 * 只显示图标，无标签和工具提示
 */
export const MinimalTimerControls: React.FC<Omit<TimerControlsProps, 'variant' | 'showLabels' | 'showTooltips'>> = React.memo((props) => (
  <TimerControls 
    {...props} 
    variant="minimal" 
    showLabels={false} 
    showTooltips={false}
    size="small"
  />
));

/**
 * 触摸友好的控制按钮组件
 * 专为移动设备优化
 */
export const TouchFriendlyTimerControls: React.FC<TimerControlsProps> = React.memo((props) => (
  <TimerControls 
    {...props}
    size="large"
    touchFriendly={true}
    showTooltips={false}
    keyboardShortcuts={false}
  />
));

/**
 * 带键盘帮助的控制按钮组件
 * 显示键盘快捷键帮助
 */
export const KeyboardFriendlyTimerControls: React.FC<TimerControlsProps> = React.memo((props) => (
  <TimerControls 
    {...props}
    keyboardShortcuts={true}
    showKeyboardHelp={true}
    showTooltips={true}
  />
));

// 设置显示名称
TimerControls.displayName = 'TimerControls';
FloatingTimerControls.displayName = 'FloatingTimerControls';
CompactTimerControls.displayName = 'CompactTimerControls';
MinimalTimerControls.displayName = 'MinimalTimerControls';
TouchFriendlyTimerControls.displayName = 'TouchFriendlyTimerControls';
KeyboardFriendlyTimerControls.displayName = 'KeyboardFriendlyTimerControls';

export default TimerControls;