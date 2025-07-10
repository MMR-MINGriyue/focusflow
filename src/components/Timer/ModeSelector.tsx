/**
 * 计时器模式选择器组件
 * 允许用户在经典模式和智能模式之间切换
 */

import React, { useState } from 'react';
import { TimerMode, MODE_DISPLAY_CONFIG, ModeSwitchOptions } from '../../types/unifiedTimer';
import { Button } from '../ui/Button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/DropdownMenu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../ui/Dialog';
import { ChevronDown, Info, AlertTriangle } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: TimerMode;
  isActive: boolean;
  onModeChange: (mode: TimerMode, options?: ModeSwitchOptions) => void;
  className?: string;
  variant?: 'dropdown' | 'tabs' | 'toggle';
  showDescription?: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  isActive,
  onModeChange,
  className = '',
  variant = 'dropdown',
  showDescription = true
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingMode, setPendingMode] = useState<TimerMode | null>(null);

  const currentConfig = MODE_DISPLAY_CONFIG[currentMode];
  const modes = Object.values(TimerMode);

  // 处理模式切换
  const handleModeSwitch = (newMode: TimerMode) => {
    if (newMode === currentMode) return;

    // 如果计时器正在运行，显示确认对话框
    if (isActive) {
      setPendingMode(newMode);
      setShowConfirmDialog(true);
    } else {
      // 直接切换
      onModeChange(newMode, {
        preserveCurrentTime: false,
        pauseBeforeSwitch: false,
        showConfirmDialog: false,
        resetOnSwitch: true
      });
    }
  };

  // 确认切换
  const confirmModeSwitch = (preserveTime: boolean = false) => {
    if (pendingMode) {
      onModeChange(pendingMode, {
        preserveCurrentTime: preserveTime,
        pauseBeforeSwitch: true,
        showConfirmDialog: false,
        resetOnSwitch: !preserveTime
      });
      setShowConfirmDialog(false);
      setPendingMode(null);
    }
  };

  // 取消切换
  const cancelModeSwitch = () => {
    setShowConfirmDialog(false);
    setPendingMode(null);
  };

  // 渲染下拉菜单模式
  const renderDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center space-x-2 ${className}`}
          disabled={false}
        >
          <span className="text-lg">{currentConfig.icon}</span>
          <span className="font-medium">{currentConfig.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        {modes.map((mode) => {
          const config = MODE_DISPLAY_CONFIG[mode];
          const isSelected = mode === currentMode;
          
          return (
            <DropdownMenuItem
              key={mode}
              onClick={() => handleModeSwitch(mode)}
              className={`p-4 cursor-pointer ${isSelected ? 'bg-accent' : ''}`}
            >
              <div className="flex items-start space-x-3 w-full">
                <span className="text-2xl">{config.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{config.name}</span>
                    {isSelected && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        当前
                      </span>
                    )}
                  </div>
                  {showDescription && (
                    <>
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {config.features.slice(0, 3).map((feature, index) => (
                          <span
                            key={index}
                            className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                        {config.features.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{config.features.length - 3}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3 mr-1" />
          运行时切换会暂停当前计时器
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // 渲染标签页模式
  const renderTabs = () => (
    <div className={`flex bg-muted rounded-lg p-1 ${className}`}>
      {modes.map((mode) => {
        const config = MODE_DISPLAY_CONFIG[mode];
        const isSelected = mode === currentMode;
        
        return (
          <button
            key={mode}
            onClick={() => handleModeSwitch(mode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <span>{config.icon}</span>
            <span>{config.name}</span>
          </button>
        );
      })}
    </div>
  );

  // 渲染切换按钮模式
  const renderToggle = () => {
    const otherMode = currentMode === TimerMode.CLASSIC ? TimerMode.SMART : TimerMode.CLASSIC;
    const otherConfig = MODE_DISPLAY_CONFIG[otherMode];
    
    return (
      <Button
        variant="outline"
        onClick={() => handleModeSwitch(otherMode)}
        className={`flex items-center space-x-2 ${className}`}
      >
        <span>切换到</span>
        <span>{otherConfig.icon}</span>
        <span>{otherConfig.name}</span>
      </Button>
    );
  };

  return (
    <>
      {/* 模式选择器 */}
      {variant === 'dropdown' && renderDropdown()}
      {variant === 'tabs' && renderTabs()}
      {variant === 'toggle' && renderToggle()}

      {/* 确认对话框 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>切换计时器模式</span>
            </DialogTitle>
            <DialogDescription>
              计时器正在运行中。切换模式将会暂停当前计时器。
            </DialogDescription>
          </DialogHeader>
          
          {pendingMode && (
            <div className="py-4">
              <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                <span className="text-2xl">{MODE_DISPLAY_CONFIG[pendingMode].icon}</span>
                <div>
                  <div className="font-medium">{MODE_DISPLAY_CONFIG[pendingMode].name}</div>
                  <div className="text-sm text-muted-foreground">
                    {MODE_DISPLAY_CONFIG[pendingMode].description}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col space-y-2">
            <div className="flex space-x-2 w-full">
              <Button
                variant="outline"
                onClick={() => confirmModeSwitch(true)}
                className="flex-1"
              >
                保留当前时间
              </Button>
              <Button
                onClick={() => confirmModeSwitch(false)}
                className="flex-1"
              >
                重新开始
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={cancelModeSwitch}
              className="w-full"
            >
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModeSelector;
