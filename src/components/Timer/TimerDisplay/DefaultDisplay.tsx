import React from 'react';
import { TimerStyleConfig } from '../../../types/timerStyle';

interface DefaultDisplayProps {
  formattedTime: string;
  currentState: 'focus' | 'break' | 'microBreak';
  progress: number;
  isActive: boolean;
  stateText: string;
  style: TimerStyleConfig;
}

const DefaultDisplay: React.FC<DefaultDisplayProps> = ({ formattedTime }) => {
  return (
    <div className="default-timer-display flex items-center justify-center p-4">
      <div className="text-2xl font-mono">
        {formattedTime}
      </div>
    </div>
  );
};

export default DefaultDisplay;