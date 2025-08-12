import React, { useMemo } from 'react';
import { TimerStyleConfig } from '../../../types/timerStyle';

interface NeonDisplayProps {
  formattedTime: string;
  currentState: 'focus' | 'break' | 'microBreak';
  progress: number;
  isActive: boolean;
  stateText: string;
  style: TimerStyleConfig;
}

const NeonDisplay: React.FC<NeonDisplayProps> = React.memo(({
  formattedTime,
  currentState,
  progress,
  stateText,
  style
}) => {
  const neonColor = useMemo(() => {
    switch (currentState) {
      case 'focus': return style.colors.primary;
      case 'break': return '#ff006e';
      case 'microBreak': return '#ffbe0b';
      default: return style.colors.text;
    }
  }, [currentState, style.colors]);

  return (
    <div
      className="neon-timer-display p-8 rounded-lg"
      style={{
        backgroundColor: 'var(--timer-background-color)',
        '--neon-color': neonColor
      } as React.CSSProperties}
    >
      <div className="flex flex-col items-center space-y-6">
        <div
          className={`timer-time ${style.animations.enabled ? 'transition-all duration-300' : ''} ${
            style.animations.breathingEffect ? 'animate-pulse' : ''
          }`}
          style={{
            fontSize: 'var(--timer-font-size)',
            fontWeight: '700',
            fontFamily: '"Courier New", monospace',
            color: neonColor,
            textShadow: `
              0 0 5px ${neonColor},
              0 0 10px ${neonColor},
              0 0 15px ${neonColor},
              0 0 20px ${neonColor}
            `,
            filter: 'brightness(1.2) contrast(1.1)'
          } as React.CSSProperties}
        >
          {formattedTime}
        </div>

        {style.layout.showStateText && (
          <div
            className="text-lg font-medium uppercase tracking-widest"
            style={{
              color: neonColor,
              textShadow: `0 0 5px ${neonColor}`
            } as React.CSSProperties}
          >
            {stateText}
          </div>
        )}

        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${style.animations.enabled ? 'transition-all duration-300' : ''}`}
            style={{
              width: `${progress}%`,
              backgroundColor: neonColor,
              boxShadow: `0 0 10px ${neonColor}`
            } as React.CSSProperties}
          />
        </div>

        {style.layout.showProgressPercentage && (
          <div
            className="text-sm font-mono"
            style={{
              color: neonColor,
              textShadow: `0 0 3px ${neonColor}`
            } as React.CSSProperties}
          >
            {Math.round(progress).toString().padStart(3, '0')}%
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

NeonDisplay.displayName = 'NeonDisplay';
export default NeonDisplay;