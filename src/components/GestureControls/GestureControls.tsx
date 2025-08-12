import React, { useState, useEffect, useRef } from 'react';

interface GestureControlsProps {
  enabled?: boolean;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onSkip?: () => void;
  onVolumeToggle?: () => void;
  onThemeToggle?: () => void;
  children?: React.ReactNode;
}

const GestureControls: React.FC<GestureControlsProps> = ({
  enabled = true,
  onStart,
  onPause,
  onReset,
  onSkip,
  onVolumeToggle,
  onThemeToggle,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gestureFeedback, setGestureFeedback] = useState<string>('');
  const [isSupported, setIsSupported] = useState(true);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchStartTime = useRef(0);

  const showFeedback = (message: string) => {
    setGestureFeedback(message);
    setTimeout(() => setGestureFeedback(''), 2000);
  };

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
        touchStartTime.current = Date.now();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartPos.current.x;
      const deltaY = touch.clientY - touchStartPos.current.y;
      const deltaTime = Date.now() - touchStartTime.current;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const distance = Math.sqrt(absX * absX + absY * absY);

      // 过滤掉过小的移动
      if (distance < 30) {
        // 点击手势
        if (deltaTime < 300) {
          onStart?.();
          showFeedback('开始');
        }
        return;
      }

      // 手势识别
      if (absX > absY) {
        // 水平滑动
        if (deltaX > 50) {
          onStart?.();
          showFeedback('开始');
        } else if (deltaX < -50) {
          onReset?.();
          showFeedback('重置');
        }
      } else {
        // 垂直滑动
        if (deltaY < -50) {
          onSkip?.();
          showFeedback('跳过');
        } else if (deltaY > 50) {
          onVolumeToggle?.();
          showFeedback('静音');
        }
      }
    };



    // 添加事件监听器
    container.addEventListener('touchstart', handleTouchStart as EventListener, { passive: false });
    container.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false });
    container.addEventListener('touchend', handleTouchEnd as EventListener, { passive: false });

    // 检测手势支持
    if (!('ontouchstart' in window)) {
      setIsSupported(false);
    }

    return () => {
      container.removeEventListener('touchstart', handleTouchStart as EventListener);
      container.removeEventListener('touchmove', handleTouchMove as EventListener);
      container.removeEventListener('touchend', handleTouchEnd as EventListener);
    };
  }, [enabled, onStart, onPause, onReset, onSkip, onVolumeToggle, onThemeToggle]);

  const handleMouseGesture = (gesture: string) => {
    if (!enabled) return;

    switch (gesture) {
      case 'start':
        onStart?.();
        showFeedback('开始');
        break;
      case 'pause':
        onPause?.();
        showFeedback('暂停');
        break;
      case 'reset':
        onReset?.();
        showFeedback('重置');
        break;
      case 'skip':
        onSkip?.();
        showFeedback('跳过');
        break;
    }
  };

  return (
    <div className="gesture-controls" ref={containerRef}>
      {children}

      {/* 手势反馈显示 */}
      {gestureFeedback && (
        <div className="gesture-feedback">
          {gestureFeedback}
        </div>
      )}

      {/* 手势提示 */}
      <div className="gesture-help">
        <h3>手势控制</h3>
        <div className="gesture-list">
          <div className="gesture-item">
            <span className="gesture-icon">👆</span>
            <span>单击开始</span>
          </div>
          <div className="gesture-item">
            <span className="gesture-icon">👆👆</span>
            <span>双击暂停</span>
          </div>
          <div className="gesture-item">
            <span className="gesture-icon">👉</span>
            <span>右滑开始</span>
          </div>
          <div className="gesture-item">
            <span className="gesture-icon">👈</span>
            <span>左滑重置</span>
          </div>
          <div className="gesture-item">
            <span className="gesture-icon">👆</span>
            <span>上滑跳过</span>
          </div>
          <div className="gesture-item">
            <span className="gesture-icon">👇</span>
            <span>下滑静音</span>
          </div>
        </div>
      </div>

      {/* 键盘快捷键 */}
      <div className="keyboard-shortcuts">
        <h4>键盘快捷键</h4>
        <div className="shortcut-list">
          <div className="shortcut-item">
            <kbd>空格</kbd>
            <span>开始/暂停</span>
          </div>
          <div className="shortcut-item">
            <kbd>R</kbd>
            <span>重置</span>
          </div>
          <div className="shortcut-item">
            <kbd>S</kbd>
            <span>跳过</span>
          </div>
          <div className="shortcut-item">
            <kbd>M</kbd>
            <span>静音</span>
          </div>
          <div className="shortcut-item">
            <kbd>T</kbd>
            <span>切换主题</span>
          </div>
        </div>
      </div>

      {/* 鼠标控制按钮 */}
      <div className="mouse-controls">
        <button onClick={() => handleMouseGesture('start')}>开始</button>
        <button onClick={() => handleMouseGesture('pause')}>暂停</button>
        <button onClick={() => handleMouseGesture('reset')}>重置</button>
        <button onClick={() => handleMouseGesture('skip')}>跳过</button>
      </div>

      {!isSupported && (
        <div className="unsupported-warning">
          ⚠️ 当前设备不支持触摸手势，请使用键盘快捷键或鼠标控制
        </div>
      )}

      <style>{`
        .gesture-controls {
          position: relative;
          width: 100%;
          height: 100%;
          touch-action: none;
        }

        .gesture-feedback {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 20px 40px;
          border-radius: 50px;
          font-size: 24px;
          font-weight: bold;
          z-index: 1000;
          animation: fadeInOut 2s ease-in-out;
        }

        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }

        .gesture-help {
          position: absolute;
          top: 20px;
          left: 20px;
          background: var(--card);
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          max-width: 200px;
          border: 1px solid var(--border);
        }

        .gesture-help h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--foreground);
        }

        .gesture-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .gesture-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--muted-foreground);
        }

        .gesture-icon {
          font-size: 16px;
          min-width: 30px;
        }

        .keyboard-shortcuts {
          position: absolute;
          top: 20px;
          right: 20px;
          background: var(--card);
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          max-width: 200px;
          border: 1px solid var(--border);
        }

        .keyboard-shortcuts h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--foreground);
        }

        .shortcut-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .shortcut-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--muted-foreground);
        }

        .shortcut-item kbd {
          background: var(--muted);
          color: var(--muted-foreground);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-family: monospace;
          min-width: 20px;
          text-align: center;
        }

        .mouse-controls {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
        }

        .mouse-controls button {
          padding: 8px 16px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--foreground);
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .mouse-controls button:hover {
          background: var(--accent);
        }

        .unsupported-warning {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--destructive);
          color: var(--destructive-foreground);
          padding: 16px;
          border-radius: 8px;
          text-align: center;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default GestureControls;