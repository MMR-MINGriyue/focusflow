/**
 * 移动端触摸优化组件
 * 提供触摸友好的交互体验
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { useDeviceType } from '../../hooks/useScreenSize';

// 触摸手势类型
export type GestureType = 'tap' | 'longPress' | 'swipe' | 'pinch' | 'pan';

// 滑动方向
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

// 触摸事件数据
export interface TouchEventData {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  duration: number;
  velocity: number;
  direction?: SwipeDirection;
}

// 触摸配置
export interface TouchConfig {
  tapThreshold: number;
  longPressDelay: number;
  swipeThreshold: number;
  swipeVelocityThreshold: number;
  preventScroll: boolean;
  enableHapticFeedback: boolean;
}

// 默认触摸配置
const DEFAULT_TOUCH_CONFIG: TouchConfig = {
  tapThreshold: 10,
  longPressDelay: 500,
  swipeThreshold: 50,
  swipeVelocityThreshold: 0.3,
  preventScroll: false,
  enableHapticFeedback: true
};

// 触摸优化容器属性
export interface TouchOptimizedProps extends React.HTMLAttributes<HTMLDivElement> {
  onTap?: (event: TouchEventData) => void;
  onLongPress?: (event: TouchEventData) => void;
  onSwipe?: (direction: SwipeDirection, event: TouchEventData) => void;
  onPan?: (event: TouchEventData) => void;
  config?: Partial<TouchConfig>;
  disabled?: boolean;
  hapticFeedback?: boolean;
  children: React.ReactNode;
}

/**
 * 触摸优化容器组件
 */
export const TouchOptimized: React.FC<TouchOptimizedProps> = ({
  onTap,
  onLongPress,
  onSwipe,
  onPan,
  config = {},
  disabled = false,
  hapticFeedback = true,
  children,
  className,
  ...props
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const touchDataRef = useRef<{
    startTime: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isLongPress: boolean;
    longPressTimer?: NodeJS.Timeout;
  } | null>(null);

  const { isTouch } = useDeviceType();
  const touchConfig = { ...DEFAULT_TOUCH_CONFIG, ...config };

  // 触发触觉反馈
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!hapticFeedback || !touchConfig.enableHapticFeedback) return;
    
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  }, [hapticFeedback, touchConfig.enableHapticFeedback]);

  // 获取触摸事件数据
  const getTouchEventData = useCallback((touch: Touch): TouchEventData => {
    const data = touchDataRef.current;
    if (!data) {
      return {
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX: 0,
        deltaY: 0,
        distance: 0,
        duration: 0,
        velocity: 0
      };
    }

    const deltaX = touch.clientX - data.startX;
    const deltaY = touch.clientY - data.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - data.startTime;
    const velocity = duration > 0 ? distance / duration : 0;

    let direction: SwipeDirection | undefined;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    return {
      startX: data.startX,
      startY: data.startY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
      distance,
      duration,
      velocity,
      direction
    };
  }, []);

  // 触摸开始处理
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled || !isTouch) return;

    const touch = event.touches[0];
    if (!touch) return;

    touchDataRef.current = {
      startTime: Date.now(),
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isLongPress: false
    };

    // 设置长按定时器
    if (onLongPress) {
      touchDataRef.current.longPressTimer = setTimeout(() => {
        if (touchDataRef.current) {
          touchDataRef.current.isLongPress = true;
          const eventData = getTouchEventData(touch);
          triggerHapticFeedback('medium');
          onLongPress(eventData);
        }
      }, touchConfig.longPressDelay);
    }

    // 阻止滚动（如果配置了）
    if (touchConfig.preventScroll) {
      event.preventDefault();
    }
  }, [disabled, isTouch, onLongPress, touchConfig.longPressDelay, touchConfig.preventScroll, getTouchEventData, triggerHapticFeedback]);

  // 触摸移动处理
  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (disabled || !isTouch || !touchDataRef.current) return;

    const touch = event.touches[0];
    if (!touch) return;

    touchDataRef.current.currentX = touch.clientX;
    touchDataRef.current.currentY = touch.clientY;

    const eventData = getTouchEventData(touch);

    // 如果移动距离超过阈值，取消长按
    if (eventData.distance > touchConfig.tapThreshold && touchDataRef.current.longPressTimer) {
      clearTimeout(touchDataRef.current.longPressTimer);
      touchDataRef.current.longPressTimer = undefined;
    }

    // 触发拖拽事件
    if (onPan && eventData.distance > touchConfig.tapThreshold) {
      onPan(eventData);
    }

    // 阻止滚动（如果配置了）
    if (touchConfig.preventScroll) {
      event.preventDefault();
    }
  }, [disabled, isTouch, touchConfig.tapThreshold, touchConfig.preventScroll, getTouchEventData, onPan]);

  // 触摸结束处理
  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (disabled || !isTouch || !touchDataRef.current) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const eventData = getTouchEventData(touch);

    // 清除长按定时器
    if (touchDataRef.current.longPressTimer) {
      clearTimeout(touchDataRef.current.longPressTimer);
    }

    // 如果已经触发了长按，不再处理其他事件
    if (touchDataRef.current.isLongPress) {
      touchDataRef.current = null;
      return;
    }

    // 判断是否为滑动
    if (eventData.distance > touchConfig.swipeThreshold && 
        eventData.velocity > touchConfig.swipeVelocityThreshold &&
        eventData.direction) {
      triggerHapticFeedback('light');
      onSwipe?.(eventData.direction, eventData);
    }
    // 判断是否为点击
    else if (eventData.distance <= touchConfig.tapThreshold && onTap) {
      triggerHapticFeedback('light');
      onTap(eventData);
    }

    touchDataRef.current = null;
  }, [disabled, isTouch, touchConfig.swipeThreshold, touchConfig.swipeVelocityThreshold, touchConfig.tapThreshold, getTouchEventData, triggerHapticFeedback, onSwipe, onTap]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (touchDataRef.current?.longPressTimer) {
        clearTimeout(touchDataRef.current.longPressTimer);
      }
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className={cn(
        'touch-manipulation select-none',
        isTouch && 'cursor-pointer',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      {children}
    </div>
  );
};

// 触摸友好的按钮组件
export interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  hapticFeedback?: boolean;
  children: React.ReactNode;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  variant = 'primary',
  size = 'md',
  hapticFeedback = true,
  children,
  className,
  onClick,
  ...props
}) => {
  const { isTouch } = useDeviceType();

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/95',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/90',
    ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/90'
  };

  const sizeClasses = {
    sm: 'h-10 px-4 text-sm min-h-[44px]', // 确保触摸目标足够大
    md: 'h-12 px-6 text-base min-h-[48px]',
    lg: 'h-14 px-8 text-lg min-h-[52px]'
  };

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    // 触发触觉反馈
    if (hapticFeedback && isTouch && 'vibrate' in navigator) {
      navigator.vibrate([10]);
    }
    
    onClick?.(event);
  }, [hapticFeedback, isTouch, onClick]);

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'touch-manipulation select-none',
        isTouch && 'active:scale-95',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

// 滑动卡片组件
export interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
  threshold?: number;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className,
  threshold = 50
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleSwipe = useCallback((direction: SwipeDirection) => {
    switch (direction) {
      case 'left':
        onSwipeLeft?.();
        break;
      case 'right':
        onSwipeRight?.();
        break;
      case 'up':
        onSwipeUp?.();
        break;
      case 'down':
        onSwipeDown?.();
        break;
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const handlePan = useCallback((event: TouchEventData) => {
    setIsDragging(true);
    setOffset({ x: event.deltaX, y: event.deltaY });
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setOffset({ x: 0, y: 0 });
  }, []);

  return (
    <TouchOptimized
      onSwipe={handleSwipe}
      onPan={handlePan}
      config={{ swipeThreshold: threshold }}
      className={cn(
        'transition-transform duration-200',
        isDragging && 'transition-none',
        className
      )}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`
      }}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </TouchOptimized>
  );
};

// 长按菜单组件
export interface LongPressMenuProps {
  children: React.ReactNode;
  menuItems: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    destructive?: boolean;
  }>;
  className?: string;
}

export const LongPressMenu: React.FC<LongPressMenuProps> = ({
  children,
  menuItems,
  className
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleLongPress = useCallback((event: TouchEventData) => {
    setMenuPosition({ x: event.currentX, y: event.currentY });
    setShowMenu(true);
  }, []);

  const handleMenuItemClick = useCallback((onClick: () => void) => {
    onClick();
    setShowMenu(false);
  }, []);

  const handleOutsideClick = useCallback(() => {
    setShowMenu(false);
  }, []);

  useEffect(() => {
    if (showMenu) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [showMenu, handleOutsideClick]);

  return (
    <>
      <TouchOptimized
        onLongPress={handleLongPress}
        className={className}
      >
        {children}
      </TouchOptimized>

      {showMenu && (
        <div
          className="fixed z-50 bg-background border border-border rounded-lg shadow-lg py-2 min-w-[150px]"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleMenuItemClick(item.onClick)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors',
                item.destructive && 'text-destructive hover:bg-destructive/10'
              )}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default TouchOptimized;