import React from 'react';
import { TimerStyleConfig } from '../../../types/timerStyle';

interface MinimalDisplayProps {
  formattedTime: string;
  currentState: 'focus' | 'break' | 'microBreak';
  progress: number;
  isActive: boolean;
  stateText: string;
  style: TimerStyleConfig;
}

const MinimalDisplay: React.FC<MinimalDisplayProps> = React.memo(({
  formattedTime,
  progress,
  style
}) => {
  return (
    <div className="minimal-timer-display flex flex-col items-center space-y-3">
      <div
        className={`timer-time ${style.animations.enabled ? 'transition-all duration-300' : ''}`}
        style={{
          fontSize: 'var(--timer-font-size)',
          fontWeight: '200',
          fontFamily: 'var(--timer-font-family)',
          color: 'var(--timer-state-color)',
          letterSpacing: '0.1em'
        } as React.CSSProperties}
      >
        {formattedTime}
      </div>

      {style.progressStyle === 'linear' && (
        <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${style.animations.enabled ? 'transition-all duration-300' : ''}`}
            style={{
              width: `${progress}%`,
              backgroundColor: 'var(--timer-state-color)'
            } as React.CSSProperties}
          />
        </div>
      )}

      {style.layout.showProgressPercentage && (
        <div className="text-sm font-light" style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}>
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.formattedTime === nextProps.formattedTime &&
    prevProps.progress === nextProps.progress &&
    prevProps.style.id === nextProps.style.id
  );
});

MinimalDisplay.displayName = 'MinimalDisplay';
export default MinimalDisplay;