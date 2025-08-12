import React from 'react';
import { TimerStyleConfig } from '../../../types/timerStyle';

interface QuickDisplayProps {
  formattedTime: string;
  currentState: 'focus' | 'break' | 'microBreak';
  progress: number;
  isActive: boolean;
  stateText: string;
  style: TimerStyleConfig;
}

const QuickDisplay: React.FC<QuickDisplayProps> = ({ formattedTime, stateText, style }) => {
  return (
    <div className="quick-timer-display flex flex-col items-center justify-center p-4">
      <div
        className="text-3xl font-mono"
        style={{
          fontFamily: 'var(--timer-font-family)',
          color: 'var(--timer-state-color)'
        } as React.CSSProperties}
      >
        {formattedTime}
      </div>
      {style.layout.showStateText && (
        <div
          className="text-sm mt-2"
          style={{ color: 'var(--timer-secondary-color)' } as React.CSSProperties}
        >
          {stateText}
        </div>
      )}
    </div>
  );
};

export default QuickDisplay;