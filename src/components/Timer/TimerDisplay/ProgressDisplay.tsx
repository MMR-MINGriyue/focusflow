import React from 'react';
import { TimerStyleConfig } from '../../../types/timerStyle';

interface ProgressDisplayProps {
  formattedTime: string;
  currentState: 'focus' | 'break' | 'microBreak';
  progress: number;
  isActive: boolean;
  stateText: string;
  style: TimerStyleConfig;
}

const ProgressDisplay: React.FC<ProgressDisplayProps> = React.memo(({
  formattedTime,
  progress,
  stateText,
  style
}) => {
  return (
    <div className="progress-timer-display flex flex-col items-center space-y-6">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="var(--timer-progress-bg)"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="var(--timer-state-color)"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={`${progress * 2.83} 283`}
            strokeLinecap="round"
            className={`${style.animations.enabled ? 'transition-all duration-300' : ''} ${
              style.animations.breathingEffect ? 'animate-pulse' : ''
            }`}
            style={{
              filter: style.displayStyle === 'neon' ? 'drop-shadow(0 0 3px var(--timer-state-color))' : 'none'
            } as React.CSSProperties}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="text-3xl font-bold mb-2"
            style={{
              color: 'var(--timer-state-color)',
              fontFamily: 'var(--timer-font-family)'
            } as React.CSSProperties}
          >
            {formattedTime}
          </div>
          {style.layout.showProgressPercentage && (
            <div className="text-lg" style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}>
              {Math.round(progress)}%
            </div>
          )}
        </div>
      </div>

      {style.layout.showStateText && (
        <div
          className="timer-state-text text-xl font-medium"
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

ProgressDisplay.displayName = 'ProgressDisplay';
export default ProgressDisplay;