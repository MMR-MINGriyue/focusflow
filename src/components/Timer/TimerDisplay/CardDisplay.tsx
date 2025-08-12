import React from 'react';
import { TimerStyleConfig } from '../../../types/timerStyle';

interface CardDisplayProps {
  formattedTime: string;
  currentState: 'focus' | 'break' | 'microBreak';
  progress: number;
  isActive: boolean;
  stateText: string;
  style: TimerStyleConfig;
}

const CardDisplay: React.FC<CardDisplayProps> = React.memo(({
  formattedTime,
  progress,
  stateText,
  style
}) => {
  return (
    <div
      className="card-timer-display p-8 rounded-2xl shadow-lg border"
      style={{
        backgroundColor: 'var(--timer-background-color)',
        borderColor: 'var(--timer-progress-bg)'
      } as React.CSSProperties}
    >
      <div className="flex flex-col items-center space-y-4">
        {style.layout.showStateText && (
          <div
            className="text-sm font-medium uppercase tracking-wider"
            style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}
          >
            {stateText}
          </div>
        )}

        <div
          className="timer-time"
          style={{
            fontSize: 'var(--timer-font-size)',
            fontWeight: 'var(--timer-font-weight)',
            fontFamily: 'var(--timer-font-family)',
            color: 'var(--timer-state-color)'
          } as React.CSSProperties}
        >
          {formattedTime}
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${style.animations.enabled ? 'transition-all duration-300' : ''}`}
            style={{
              width: `${progress}%`,
              backgroundColor: 'var(--timer-state-color)'
            } as React.CSSProperties}
          />
        </div>

        {style.layout.showProgressPercentage && (
          <div className="text-sm" style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}>
            {Math.round(progress)}% 完成
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.formattedTime === nextProps.formattedTime &&
    prevProps.progress === nextProps.progress &&
    prevProps.style.id === nextProps.style.id
  );
});

CardDisplay.displayName = 'CardDisplay';
export default CardDisplay;