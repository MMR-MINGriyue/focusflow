
/**
 * 现代化加载动画组件
 * 提供多种风格的加载动画效果
 */

import React from 'react';
import { cn } from '../../utils/cn';

// 加载动画类型
export type SpinnerType = 'pulse' | 'dots' | 'bars' | 'circle' | 'ripple' | 'bounce';

// 加载动画大小
export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ModernLoadingSpinnerProps {
  type?: SpinnerType;
  size?: SpinnerSize;
  color?: string;
  className?: string;
  text?: string;
  centered?: boolean;
}

/**
 * 现代化加载动画组件
 */
export const ModernLoadingSpinner: React.FC<ModernLoadingSpinnerProps> = ({
  type = 'circle',
  size = 'md',
  color,
  className,
  text,
  centered = false,
}) => {
  // 获取尺寸配置
  const getSizeConfig = (size: SpinnerSize) => {
    switch (size) {
      case 'xs':
        return {
          container: 'w-4 h-4',
          dots: 'w-1 h-1',
          bars: 'w-1 h-6',
          circle: 'w-4 h-4 border-2',
          ripple: 'w-4 h-4',
          bounce: 'w-2 h-2',
          textSize: 'text-xs',
        };
      case 'sm':
        return {
          container: 'w-6 h-6',
          dots: 'w-1.5 h-1.5',
          bars: 'w-1.5 h-8',
          circle: 'w-6 h-6 border-2',
          ripple: 'w-6 h-6',
          bounce: 'w-3 h-3',
          textSize: 'text-sm',
        };
      case 'md':
        return {
          container: 'w-8 h-8',
          dots: 'w-2 h-2',
          bars: 'w-2 h-10',
          circle: 'w-8 h-8 border-3',
          ripple: 'w-8 h-8',
          bounce: 'w-4 h-4',
          textSize: 'text-base',
        };
      case 'lg':
        return {
          container: 'w-12 h-12',
          dots: 'w-3 h-3',
          bars: 'w-3 h-12',
          circle: 'w-12 h-12 border-4',
          ripple: 'w-12 h-12',
          bounce: 'w-6 h-6',
          textSize: 'text-lg',
        };
      case 'xl':
        return {
          container: 'w-16 h-16',
          dots: 'w-4 h-4',
          bars: 'w-4 h-16',
          circle: 'w-16 h-16 border-4',
          ripple: 'w-16 h-16',
          bounce: 'w-8 h-8',
          textSize: 'text-xl',
        };
      default:
        return {
          container: 'w-8 h-8',
          dots: 'w-2 h-2',
          bars: 'w-2 h-10',
          circle: 'w-8 h-8 border-3',
          ripple: 'w-8 h-8',
          bounce: 'w-4 h-4',
          textSize: 'text-base',
        };
    }
  };

  const sizeConfig = getSizeConfig(size);
  const spinnerColor = color || 'text-blue-600';

  // 脉冲动画
  const renderPulseSpinner = () => (
    <div className={cn('relative', sizeConfig.container, className)}>
      <div
        className={cn(
          'absolute inset-0 rounded-full bg-current opacity-75 animate-ping',
          spinnerColor
        )}
      />
      <div
        className={cn(
          'relative rounded-full bg-current',
          sizeConfig.container,
          spinnerColor
        )}
      />
    </div>
  );

  // 点状动画
  const renderDotsSpinner = () => (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full bg-current animate-bounce',
            sizeConfig.dots,
            spinnerColor
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s',
          }}
        />
      ))}
    </div>
  );

  // 条状动画
  const renderBarsSpinner = () => (
    <div className={cn('flex items-end justify-center space-x-1', className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-sm bg-current animate-pulse',
            sizeConfig.bars,
            spinnerColor
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1.2s',
          }}
        />
      ))}
    </div>
  );

  // 圆形动画
  const renderCircleSpinner = () => (
    <div className={cn('relative', sizeConfig.container, className)}>
      <div
        className={cn(
          'absolute inset-0 rounded-full border-current border-t-transparent animate-spin',
          sizeConfig.circle,
          spinnerColor
        )}
      />
    </div>
  );

  // 涟漪动画
  const renderRippleSpinner = () => (
    <div className={cn('relative', sizeConfig.container, className)}>
      {[0, 1].map((i) => (
        <div
          key={i}
          className={cn(
            'absolute inset-0 rounded-full border border-current opacity-0 animate-ripple',
            sizeConfig.ripple,
            spinnerColor
          )}
          style={{
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );

  // 弹跳动画
  const renderBounceSpinner = () => (
    <div className={cn('relative', sizeConfig.container, className)}>
      {[0, 1].map((i) => (
        <div
          key={i}
          className={cn(
            'absolute rounded-full bg-current',
            sizeConfig.bounce,
            spinnerColor,
            i === 0 ? 'animate-bounce' : 'animate-bounce-reverse'
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s',
          }}
        />
      ))}
    </div>
  );

  // 渲染对应的动画类型
  const renderSpinner = () => {
    switch (type) {
      case 'pulse':
        return renderPulseSpinner();
      case 'dots':
        return renderDotsSpinner();
      case 'bars':
        return renderBarsSpinner();
      case 'ripple':
        return renderRippleSpinner();
      case 'bounce':
        return renderBounceSpinner();
      case 'circle':
      default:
        return renderCircleSpinner();
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', centered && 'w-full h-full')}>
      {renderSpinner()}
      {text && (
        <p className={cn('mt-2 font-medium', spinnerColor, sizeConfig.textSize)}>
          {text}
        </p>
      )}
    </div>
  );
};

/**
 * 页面级加载组件
 * 提供全屏加载体验
 */
export const PageLoader: React.FC<{
  text?: string;
  spinnerType?: SpinnerType;
}> = ({ text = '加载中...', spinnerType = 'circle' }) => {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <ModernLoadingSpinner
        type={spinnerType}
        size="lg"
        text={text}
        centered
      />
    </div>
  );
};

/**
 * 内容区域加载组件
 * 用于内容区域的加载状态
 */
export const ContentLoader: React.FC<{
  text?: string;
  spinnerType?: SpinnerType;
  height?: string;
}> = ({ 
  text = '加载中...', 
  spinnerType = 'dots',
  height = '200px'
}) => {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <ModernLoadingSpinner
        type={spinnerType}
        size="md"
        text={text}
      />
    </div>
  );
};

/**
 * 按钮加载组件
 * 用于按钮的加载状态
 */
export const ButtonLoader: React.FC<{
  text?: string;
  spinnerType?: SpinnerType;
  size?: SpinnerSize;
}> = ({ 
  text, 
  spinnerType = 'circle',
  size = 'sm'
}) => {
  return (
    <div className="flex items-center justify-center">
      <ModernLoadingSpinner
        type={spinnerType}
        size={size}
        className="mr-2"
      />
      {text}
    </div>
  );
};
