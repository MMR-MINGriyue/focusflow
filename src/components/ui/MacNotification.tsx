import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface MacNotificationProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  visible: boolean;
  onClose: () => void;
  autoHide?: boolean;
  duration?: number;
}

const MacNotification: React.FC<MacNotificationProps> = ({
  message,
  type,
  visible,
  onClose,
  autoHide = true,
  duration = 3000
}) => {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (visible && autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // 等待动画完成
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, autoHide, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'mac-notification-success';
      case 'error':
        return 'mac-notification-error';
      case 'warning':
        return 'mac-notification-warning';
      case 'info':
      default:
        return 'mac-notification-info';
    }
  };

  if (!visible && !isVisible) return null;

  return (
    <div
      className={`mac-notification ${getTypeClasses()} ${
        isVisible ? 'animate-mac-slide-in' : 'animate-fade-out'
      }`}
      style={{
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium font-system text-gray-900">
            {message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-150"
          aria-label="关闭通知"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default MacNotification;
