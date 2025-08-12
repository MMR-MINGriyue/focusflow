import React, { useMemo } from 'react';
import { TimerStyleConfig } from '../../../types/timerStyle';

interface AnalogDisplayProps {
  formattedTime: string;
  progress: number;
  stateText: string;
  style: TimerStyleConfig;
}

const AnalogDisplay: React.FC<AnalogDisplayProps> = React.memo(({
  formattedTime,
  progress,
  stateText,
  style
}) => {
  const displayMetrics = useMemo(() => {
    const radius = 80;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    return { radius, strokeWidth, circumference, strokeDashoffset };
  }, [progress]);

  return (
    <div className="analog-timer-display flex flex-col items-center space-y-4">
      <div className="relative">
        <svg width="200" height="200" className="transform -rotate-90">
          <circle
            cx="100"
            cy="100"
            r={displayMetrics.radius}
            stroke="var(--timer-progress-bg)"
            strokeWidth={displayMetrics.strokeWidth}
            fill="transparent"
          />
          <circle
            cx="100"
            cy="100"
            r={displayMetrics.radius}
            stroke="var(--timer-state-color)"
            strokeWidth={displayMetrics.strokeWidth}
            fill="transparent"
            strokeDasharray={displayMetrics.circumference}
            strokeDashoffset={displayMetrics.strokeDashoffset}
            strokeLinecap="round"
            className={style.animations.enabled ? 'transition-all duration-500 ease-out' : ''}
            style={{
              filter: style.displayStyle === 'neon' ? 'drop-shadow(0 0 5px var(--timer-state-color))' : 'none'
            } as React.CSSProperties}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="text-2xl font-bold"
            style={{
              color: 'var(--timer-state-color)',
              fontFamily: 'var(--timer-font-family)'
            } as React.CSSProperties}
          >
            {formattedTime}
          </div>
          {style.layout.showProgressPercentage && (
            <div className="text-sm" style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}>
              {Math.round(progress)}%
            </div>
          )}
        </div>
      </div>

      {style.layout.showStateText && (
        <div
          className="timer-state-text text-lg font-medium"
          style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}
        >
          {stateText}
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

AnalogDisplay.displayName = 'AnalogDisplay';
export default AnalogDisplay;