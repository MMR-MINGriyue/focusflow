import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { 
  Play, 
  BarChart3, 
  Database, 
  Settings, 
  Keyboard, 
  ChevronLeft, 
  ChevronRight, 
  X,
  CheckCircle
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS选择器
  position?: 'top' | 'bottom' | 'left' | 'right';
  icon?: React.ReactNode;
  action?: () => void;
}

interface OnboardingTourProps {
  isOpen?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen: controlledIsOpen,
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // 检查是否是首次使用
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('focusflow-tour-completed');
    if (!hasSeenTour && controlledIsOpen !== false) {
      setIsOpen(true);
    }
  }, [controlledIsOpen]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: '欢迎使用 FocusFlow！',
      description: '这是一个基于番茄工作法的专注管理应用，帮助您提高工作效率。让我们快速了解一下主要功能。',
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
    },
    {
      id: 'timer',
      title: '智能计时器',
      description: '核心功能是专注计时器，支持自定义专注时间和休息时间。还有随机微休息功能保护您的眼睛。',
      target: '[data-tour="timer-tab"]',
      icon: <Play className="h-6 w-6 text-blue-500" />,
      action: () => {
        const timerTab = document.querySelector('[data-tour="timer-tab"]') as HTMLElement;
        timerTab?.click();
      },
    },
    {
      id: 'controls',
      title: '计时器控制',
      description: '使用开始/暂停按钮控制计时器，或者按空格键快速操作。重置按钮可以重新开始。',
      target: '[data-tour="timer-controls"]',
      icon: <Play className="h-6 w-6 text-green-500" />,
    },
    {
      id: 'stats',
      title: '数据统计',
      description: '查看您的专注数据和效率趋势，了解自己的工作模式。',
      target: '[data-tour="stats-tab"]',
      icon: <BarChart3 className="h-6 w-6 text-purple-500" />,
      action: () => {
        const statsTab = document.querySelector('[data-tour="stats-tab"]') as HTMLElement;
        statsTab?.click();
      },
    },
    {
      id: 'database',
      title: '数据管理',
      description: '所有数据都安全存储在本地数据库中，您可以查看详细的历史记录和统计信息。',
      target: '[data-tour="database-tab"]',
      icon: <Database className="h-6 w-6 text-orange-500" />,
      action: () => {
        const dbTab = document.querySelector('[data-tour="database-tab"]') as HTMLElement;
        dbTab?.click();
      },
    },
    {
      id: 'settings',
      title: '个性化设置',
      description: '点击设置按钮可以自定义专注时间、音效、通知等。还有预设的工作模式可以选择。',
      target: '[data-tour="settings-button"]',
      icon: <Settings className="h-6 w-6 text-gray-500" />,
    },
    {
      id: 'shortcuts',
      title: '快捷键支持',
      description: '支持丰富的键盘快捷键：空格键开始/暂停，R键重置，?键查看帮助。按H键随时查看所有快捷键。',
      icon: <Keyboard className="h-6 w-6 text-indigo-500" />,
    },
    {
      id: 'complete',
      title: '开始您的专注之旅！',
      description: '现在您已经了解了所有主要功能。建议先在设置中调整适合您的时间配置，然后开始第一个专注会话。',
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStepData.action) {
      currentStepData.action();
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('focusflow-tour-completed', 'true');
    setIsOpen(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem('focusflow-tour-completed', 'true');
    setIsOpen(false);
    onSkip?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {currentStepData.icon}
            <Badge variant="outline">
              {currentStep + 1} / {steps.length}
            </Badge>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {currentStepData.description}
          </p>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>进度</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>上一步</span>
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button variant="ghost" onClick={handleSkip}>
              跳过引导
            </Button>
            <Button onClick={handleNext} className="flex items-center space-x-1">
              <span>{currentStep === steps.length - 1 ? '完成' : '下一步'}</span>
              {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* 底部提示 */}
        {currentStep === 0 && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-xs text-gray-500">
              💡 您可以随时按 <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">?</kbd> 查看快捷键帮助
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingTour;
