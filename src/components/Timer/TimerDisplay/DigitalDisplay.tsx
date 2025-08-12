import React, { useMemo } from 'react';
import { TimerStyleConfig } from '../../../types/timerStyle';

interface DigitalDisplayProps {
  formattedTime: string;
  currentState: 'focus' | 'break' | 'microBreak';
  progress: number;
  isActive: boolean;
  stateText: string;
  style: TimerStyleConfig;
}

const DigitalDisplay: React.FC<DigitalDisplayProps> = React.memo(({
  formattedTime,
  progress,
  isActive,
  stateText,
  style
}) => {
  // 缓存CSS变量
  const cssVariables = useMemo(() => ({
    '--timer-state-color': style.colors.primary,
    '--timer-font-size': '2rem',
    '--timer-secondary-color': style.colors.secondary
  } as React.CSSProperties), [style]);

  return (
    <div 
      className="digital-timer-display flex flex-col items-center space-y-4"
      style={cssVariables}
    >
      <div
        className="timer-time"
        style={{
          fontSize: 'var(--timer-font-size)',
          color: 'var(--timer-state-color)',
          lineHeight: 1,
          textAlign: 'center'
        } as React.CSSProperties}
      >
        {formattedTime}
      </div>
      
      {style.layout.showStateText && (
        <div
          className="timer-state-text text-lg font-medium"
          style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}
        >
          {stateText}
        </div>
      )}

      {style.layout.showProgressPercentage && (
        <div
          className="timer-progress text-sm font-medium"
          style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}
        >
          {Math.round(progress)}%
        </div>
      )}

      {style.animations.enabled && (
        <div
          className={`w-2 h-2 rounded-full ${isActive ? 'animate-pulse' : ''}`}
          style={{
            backgroundColor: 'var(--timer-state-color)',
            opacity: isActive ? 1 : 0.3
          } as React.CSSProperties}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.formattedTime === nextProps.formattedTime &&
    prevProps.currentState === nextProps.currentState &&
    prevProps.progress === nextProps.progress &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.stateText === nextProps.stateText &&
    prevProps.style.id === nextProps.style.id
  );
});

DigitalDisplay.displayName = 'DigitalDisplay';
export default DigitalDisplay;