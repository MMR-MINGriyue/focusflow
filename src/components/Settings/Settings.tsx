import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { 
  TimerMode, 
  ClassicTimerSettings, 
  SmartTimerSettings, 
  UnifiedTimerSettings 
} from '../../types/unifiedTimer';

interface SettingsProps {
  settings: UnifiedTimerSettings;
  onSettingsChange: (settings: Partial<UnifiedTimerSettings>) => void;
}

// 定义Card组件的Props类型
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// 定义CardHeader组件的Props类型
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

// 定义CardTitle组件的Props类型
interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

// 定义CardContent组件的Props类型
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

// 定义Label组件的Props类型
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
}

// 定义Input组件的Props类型
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

// Card组件实现
const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
    {children}
  </div>
);

// CardHeader组件实现
const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`p-6 pb-2 ${className}`}>
    {children}
  </div>
);

// CardTitle组件实现
const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

// CardContent组件实现
const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={`p-6 pt-2 ${className}`}>
    {children}
  </div>
);

// Label组件实现
const Label: React.FC<LabelProps> = ({ children, className = '', ...props }) => (
  <label 
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  >
    {children}
  </label>
);

// Input组件实现
const Input: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-300 ${className}`}
    {...props}
  />
);

export const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange }) => {
  // 经典模式设置
  const [focusDuration, setFocusDuration] = useState(settings.classic.focusDuration);
  const [breakDuration, setBreakDuration] = useState(settings.classic.breakDuration);
  const [microBreakDuration, setMicroBreakDuration] = useState(settings.classic.microBreakDuration);
  const [microBreakMinInterval, setMicroBreakMinInterval] = useState(settings.classic.microBreakMinInterval);
  
  // 智能模式设置
  const [smartFocusDuration, setSmartFocusDuration] = useState(settings.smart.focusDuration);
  const [smartBreakDuration, setSmartBreakDuration] = useState(settings.smart.breakDuration);
  const [smartMicroBreakMinInterval, setSmartMicroBreakMinInterval] = useState(settings.smart.microBreakMinInterval);
  const [smartMicroBreakMaxInterval, setSmartMicroBreakMaxInterval] = useState(settings.smart.microBreakMaxInterval);
  const [smartMicroBreakMinDuration, setSmartMicroBreakMinDuration] = useState(settings.smart.microBreakMinDuration);
  const [smartMicroBreakMaxDuration, setSmartMicroBreakMaxDuration] = useState(settings.smart.microBreakMaxDuration);
  const [peakFocusHours, setPeakFocusHours] = useState(settings.smart.peakFocusHours.join(','));
  const [lowEnergyHours, setLowEnergyHours] = useState(settings.smart.lowEnergyHours.join(','));
  const [maxContinuousFocusTime, setMaxContinuousFocusTime] = useState(settings.smart.maxContinuousFocusTime);
  const [forcedBreakThreshold, setForcedBreakThreshold] = useState(settings.smart.forcedBreakThreshold);
  
  // 通用设置
  const [mode, setMode] = useState<TimerMode>(settings.mode);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [notificationEnabled, setNotificationEnabled] = useState(settings.notificationEnabled);

  // 当设置变化时更新状态
  useEffect(() => {
    setFocusDuration(settings.classic.focusDuration);
    setBreakDuration(settings.classic.breakDuration);
    setMicroBreakDuration(settings.classic.microBreakDuration);
    setMicroBreakMinInterval(settings.classic.microBreakMinInterval);
    
    setSmartFocusDuration(settings.smart.focusDuration);
    setSmartBreakDuration(settings.smart.breakDuration);
    setSmartMicroBreakMinInterval(settings.smart.microBreakMinInterval);
    setSmartMicroBreakMaxInterval(settings.smart.microBreakMaxInterval);
    setSmartMicroBreakMinDuration(settings.smart.microBreakMinDuration);
    setSmartMicroBreakMaxDuration(settings.smart.microBreakMaxDuration);
    setPeakFocusHours(settings.smart.peakFocusHours.join(','));
    setLowEnergyHours(settings.smart.lowEnergyHours.join(','));
    setMaxContinuousFocusTime(settings.smart.maxContinuousFocusTime);
    setForcedBreakThreshold(settings.smart.forcedBreakThreshold);
    
    setMode(settings.mode);
    setSoundEnabled(settings.soundEnabled);
    setNotificationEnabled(settings.notificationEnabled);
  }, [settings]);

  // 保存经典模式设置
  const saveClassicSettings = () => {
    const newSettings: Partial<UnifiedTimerSettings> = {
      classic: {
        focusDuration,
        breakDuration,
        microBreakDuration,
        microBreakMinInterval,
        microBreakMaxInterval: microBreakMinInterval, // 使用相同的值
      } as ClassicTimerSettings
    };
    
    onSettingsChange(newSettings);
  };

  // 保存智能模式设置
  const saveSmartSettings = () => {
    const newSettings: Partial<UnifiedTimerSettings> = {
      smart: {
        focusDuration: smartFocusDuration,
        breakDuration: smartBreakDuration,
        enableMicroBreaks: true,
        microBreakMinInterval: smartMicroBreakMinInterval,
        microBreakMaxInterval: smartMicroBreakMaxInterval,
        microBreakMinDuration: smartMicroBreakMinDuration,
        microBreakMaxDuration: smartMicroBreakMaxDuration,
        enableAdaptiveAdjustment: true,
        adaptiveFactorFocus: 1.0,
        adaptiveFactorBreak: 1.0,
        enableCircadianOptimization: true,
        peakFocusHours: peakFocusHours.split(',').map(h => parseInt(h.trim())).filter(h => !isNaN(h)),
        lowEnergyHours: lowEnergyHours.split(',').map(h => parseInt(h.trim())).filter(h => !isNaN(h)),
        maxContinuousFocusTime,
        forcedBreakThreshold,
      } as SmartTimerSettings
    };
    
    onSettingsChange(newSettings);
  };

  // 保存通用设置
  const saveGeneralSettings = () => {
    const newSettings: Partial<UnifiedTimerSettings> = {
      mode,
      soundEnabled,
      notificationEnabled,
    };
    
    onSettingsChange(newSettings);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">通用设置</TabsTrigger>
          <TabsTrigger value="classic">经典模式</TabsTrigger>
          <TabsTrigger value="smart">智能模式</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>通用设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="mode">计时器模式</Label>
                <select 
                  value={mode} 
                  onChange={(e) => setMode(e.target.value as TimerMode)}
                  className="flex h-10 w-[180px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:ring-offset-gray-900 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-300"
                >
                  <option value="classic">经典模式</option>
                  <option value="smart">智能模式</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sound">音效</Label>
                <Switch
                  id="sound"
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notification">通知</Label>
                <Switch
                  id="notification"
                  checked={notificationEnabled}
                  onCheckedChange={setNotificationEnabled}
                />
              </div>
              
              <Button onClick={saveGeneralSettings}>保存通用设置</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="classic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>经典模式设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="focusDuration">专注时长 (分钟)</Label>
                <Input
                  id="focusDuration"
                  type="number"
                  value={focusDuration}
                  onChange={(e) => setFocusDuration(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="breakDuration">休息时长 (分钟)</Label>
                <Input
                  id="breakDuration"
                  type="number"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="microBreakDuration">微休息时长 (分钟)</Label>
                <Input
                  id="microBreakDuration"
                  type="number"
                  value={microBreakDuration}
                  onChange={(e) => setMicroBreakDuration(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="microBreakMinInterval">微休息间隔 (分钟)</Label>
                <Input
                  id="microBreakMinInterval"
                  type="number"
                  value={microBreakMinInterval}
                  onChange={(e) => setMicroBreakMinInterval(Number(e.target.value))}
                />
              </div>
              
              <Button onClick={saveClassicSettings}>保存经典模式设置</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="smart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>智能模式设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smartFocusDuration">专注时长 (分钟)</Label>
                <Input
                  id="smartFocusDuration"
                  type="number"
                  value={smartFocusDuration}
                  onChange={(e) => setSmartFocusDuration(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smartBreakDuration">休息时长 (分钟)</Label>
                <Input
                  id="smartBreakDuration"
                  type="number"
                  value={smartBreakDuration}
                  onChange={(e) => setSmartBreakDuration(Number(e.target.value))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smartMicroBreakMinInterval">微休息最小间隔 (分钟)</Label>
                  <Input
                    id="smartMicroBreakMinInterval"
                    type="number"
                    value={smartMicroBreakMinInterval}
                    onChange={(e) => setSmartMicroBreakMinInterval(Number(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smartMicroBreakMaxInterval">微休息最大间隔 (分钟)</Label>
                  <Input
                    id="smartMicroBreakMaxInterval"
                    type="number"
                    value={smartMicroBreakMaxInterval}
                    onChange={(e) => setSmartMicroBreakMaxInterval(Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smartMicroBreakMinDuration">微休息最短时长 (分钟)</Label>
                  <Input
                    id="smartMicroBreakMinDuration"
                    type="number"
                    value={smartMicroBreakMinDuration}
                    onChange={(e) => setSmartMicroBreakMinDuration(Number(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smartMicroBreakMaxDuration">微休息最长时长 (分钟)</Label>
                  <Input
                    id="smartMicroBreakMaxDuration"
                    type="number"
                    value={smartMicroBreakMaxDuration}
                    onChange={(e) => setSmartMicroBreakMaxDuration(Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="peakFocusHours">高效专注时段 (小时, 用逗号分隔)</Label>
                <Input
                  id="peakFocusHours"
                  value={peakFocusHours}
                  onChange={(e) => setPeakFocusHours(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lowEnergyHours">低能量时段 (小时, 用逗号分隔)</Label>
                <Input
                  id="lowEnergyHours"
                  value={lowEnergyHours}
                  onChange={(e) => setLowEnergyHours(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxContinuousFocusTime">最大连续专注时间 (分钟)</Label>
                <Input
                  id="maxContinuousFocusTime"
                  type="number"
                  value={maxContinuousFocusTime}
                  onChange={(e) => setMaxContinuousFocusTime(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="forcedBreakThreshold">强制休息阈值 (分钟)</Label>
                <Input
                  id="forcedBreakThreshold"
                  type="number"
                  value={forcedBreakThreshold}
                  onChange={(e) => setForcedBreakThreshold(Number(e.target.value))}
                />
              </div>
              
              <Button onClick={saveSmartSettings}>保存智能模式设置</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;