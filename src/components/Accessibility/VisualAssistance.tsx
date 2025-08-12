/**
 * 视觉辅助功能组件
 * 提供高对比度、字体缩放、色彩无障碍和动画控制
 */

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback,
  ReactNode
} from 'react';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import {
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Contrast,
  Palette,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Monitor,
  Sun,
  Moon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

// 视觉辅助设置
interface VisualAssistanceSettings {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  fontScale: number; // 1.0 = 100%
  reducedMotion: boolean;
  colorBlindFriendly: boolean;
  focusIndicatorEnhanced: boolean;
  darkMode: boolean;
  customColors: {
    primary: string;
    background: string;
    text: string;
    border: string;
  };
}

// 色盲类型
type ColorBlindnessType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

// 视觉辅助上下文
interface VisualAssistanceContext {
  settings: VisualAssistanceSettings;
  updateSettings: (updates: Partial<VisualAssistanceSettings>) => void;
  toggleHighContrast: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  toggleReducedMotion: () => void;
  toggleColorBlindFriendly: () => void;
  setColorBlindnessType: (type: ColorBlindnessType) => void;
  resetSettings: () => void;
}

const VisualAssistanceContext = createContext<VisualAssistanceContext | null>(null);

// 默认设置
const defaultSettings: VisualAssistanceSettings = {
  highContrast: false,
  fontSize: 'medium',
  fontScale: 1.0,
  reducedMotion: false,
  colorBlindFriendly: false,
  focusIndicatorEnhanced: false,
  darkMode: false,
  customColors: {
    primary: '#3b82f6',
    background: '#ffffff',
    text: '#1f2937',
    border: '#e5e7eb'
  }
};

// 视觉辅助Provider
export const VisualAssistanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<VisualAssistanceSettings>(() => {
    // 从localStorage加载设置
    const saved = localStorage.getItem('visual-assistance-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  // 保存设置到localStorage
  useEffect(() => {
    localStorage.setItem('visual-assistance-settings', JSON.stringify(settings));
  }, [settings]);

  // 应用CSS变量
  useEffect(() => {
    const root = document.documentElement;
    
    // 字体大小
    const fontSizeMap = {
      'small': '0.875rem',
      'medium': '1rem',
      'large': '1.125rem',
      'extra-large': '1.25rem'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);
    root.style.setProperty('--font-scale', settings.fontScale.toString());
    
    // 高对比度
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // 减少动画
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // 色盲友好
    if (settings.colorBlindFriendly) {
      root.classList.add('color-blind-friendly');
    } else {
      root.classList.remove('color-blind-friendly');
    }
    
    // 增强焦点指示器
    if (settings.focusIndicatorEnhanced) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }
    
    // 深色模式
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // 自定义颜色
    root.style.setProperty('--custom-primary', settings.customColors.primary);
    root.style.setProperty('--custom-background', settings.customColors.background);
    root.style.setProperty('--custom-text', settings.customColors.text);
    root.style.setProperty('--custom-border', settings.customColors.border);
  }, [settings]);

  // 更新设置
  const updateSettings = useCallback((updates: Partial<VisualAssistanceSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // 切换高对比度
  const toggleHighContrast = useCallback(() => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);

  // 增加字体大小
  const increaseFontSize = useCallback(() => {
    setSettings(prev => {
      const currentScale = prev.fontScale;
      const newScale = Math.min(currentScale + 0.1, 2.0);
      
      let fontSize = prev.fontSize;
      if (newScale >= 1.4) fontSize = 'extra-large';
      else if (newScale >= 1.2) fontSize = 'large';
      else if (newScale >= 1.0) fontSize = 'medium';
      else fontSize = 'small';
      
      return { ...prev, fontScale: newScale, fontSize };
    });
  }, []);

  // 减少字体大小
  const decreaseFontSize = useCallback(() => {
    setSettings(prev => {
      const currentScale = prev.fontScale;
      const newScale = Math.max(currentScale - 0.1, 0.8);
      
      let fontSize = prev.fontSize;
      if (newScale >= 1.4) fontSize = 'extra-large';
      else if (newScale >= 1.2) fontSize = 'large';
      else if (newScale >= 1.0) fontSize = 'medium';
      else fontSize = 'small';
      
      return { ...prev, fontScale: newScale, fontSize };
    });
  }, []);

  // 重置字体大小
  const resetFontSize = useCallback(() => {
    setSettings(prev => ({ ...prev, fontScale: 1.0, fontSize: 'medium' }));
  }, []);

  // 切换减少动画
  const toggleReducedMotion = useCallback(() => {
    setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  }, []);

  // 切换色盲友好
  const toggleColorBlindFriendly = useCallback(() => {
    setSettings(prev => ({ ...prev, colorBlindFriendly: !prev.colorBlindFriendly }));
  }, []);

  // 设置色盲类型
  const setColorBlindnessType = useCallback((type: ColorBlindnessType) => {
    const root = document.documentElement;
    
    // 移除所有色盲类
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia');
    
    // 添加对应类
    if (type !== 'none') {
      root.classList.add(type);
      setSettings(prev => ({ ...prev, colorBlindFriendly: true }));
    } else {
      setSettings(prev => ({ ...prev, colorBlindFriendly: false }));
    }
  }, []);

  // 重置设置
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const contextValue: VisualAssistanceContext = {
    settings,
    updateSettings,
    toggleHighContrast,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    toggleReducedMotion,
    toggleColorBlindFriendly,
    setColorBlindnessType,
    resetSettings
  };

  return (
    <VisualAssistanceContext.Provider value={contextValue}>
      {children}
    </VisualAssistanceContext.Provider>
  );
};

// 使用视觉辅助Hook
export const useVisualAssistance = () => {
  const context = useContext(VisualAssistanceContext);
  if (!context) {
    throw new Error('useVisualAssistance must be used within VisualAssistanceProvider');
  }
  return context;
};

// 可访问的动画组件
export const AccessibleMotion: React.FC<{
  children: ReactNode;
  motionProps?: MotionProps;
  fallback?: ReactNode;
  className?: string;
}> = ({ children, motionProps, fallback, className }) => {
  const { settings } = useVisualAssistance();

  if (settings.reducedMotion) {
    return (
      <div className={className}>
        {fallback || children}
      </div>
    );
  }

  return (
    <motion.div className={className} {...motionProps}>
      {children}
    </motion.div>
  );
};

// 视觉辅助控制面板
export const VisualAssistancePanel: React.FC<{
  className?: string;
  compact?: boolean;
}> = ({ className, compact = false }) => {
  const {
    settings,
    toggleHighContrast,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    toggleReducedMotion,
    toggleColorBlindFriendly,
    setColorBlindnessType,
    updateSettings,
    resetSettings
  } = useVisualAssistance();

  const [showAdvanced, setShowAdvanced] = useState(false);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleHighContrast}
          title="切换高对比度"
          aria-pressed={settings.highContrast}
        >
          <Contrast className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={decreaseFontSize}
          title="减小字体"
          disabled={settings.fontScale <= 0.8}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={increaseFontSize}
          title="增大字体"
          disabled={settings.fontScale >= 2.0}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={toggleReducedMotion}
          title="切换减少动画"
          aria-pressed={settings.reducedMotion}
        >
          {settings.reducedMotion ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          视觉辅助功能
        </CardTitle>
        <CardDescription>
          调整视觉设置以获得更好的可访问性体验
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 基础设置 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">基础设置</h3>
          
          {/* 高对比度 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">高对比度</div>
              <div className="text-sm text-muted-foreground">增强颜色对比度</div>
            </div>
            <Button
              variant={settings.highContrast ? "default" : "outline"}
              size="sm"
              onClick={toggleHighContrast}
            >
              <Contrast className="h-4 w-4 mr-2" />
              {settings.highContrast ? '已启用' : '已禁用'}
            </Button>
          </div>

          {/* 字体大小 */}
          <div className="space-y-2">
            <div className="font-medium">字体大小</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={decreaseFontSize}
                disabled={settings.fontScale <= 0.8}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <div className="flex-1 text-center">
                <div className="text-sm text-muted-foreground">
                  {Math.round(settings.fontScale * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {settings.fontSize}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={increaseFontSize}
                disabled={settings.fontScale >= 2.0}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetFontSize}
                title="重置字体大小"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 减少动画 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">减少动画</div>
              <div className="text-sm text-muted-foreground">减少或禁用动画效果</div>
            </div>
            <Button
              variant={settings.reducedMotion ? "default" : "outline"}
              size="sm"
              onClick={toggleReducedMotion}
            >
              {settings.reducedMotion ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {settings.reducedMotion ? '已启用' : '已禁用'}
            </Button>
          </div>

          {/* 深色模式 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">深色模式</div>
              <div className="text-sm text-muted-foreground">使用深色主题</div>
            </div>
            <Button
              variant={settings.darkMode ? "default" : "outline"}
              size="sm"
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            >
              {settings.darkMode ? <Moon className="h-4 w-4 mr-2" /> : <Sun className="h-4 w-4 mr-2" />}
              {settings.darkMode ? '深色' : '浅色'}
            </Button>
          </div>
        </div>

        {/* 高级设置 */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full justify-between"
          >
            <span>高级设置</span>
            <Settings className="h-4 w-4" />
          </Button>

          <AnimatePresence>
            {showAdvanced && (
              <AccessibleMotion
                motionProps={{
                  initial: { height: 0, opacity: 0 },
                  animate: { height: 'auto', opacity: 1 },
                  exit: { height: 0, opacity: 0 }
                }}
                className="overflow-hidden"
              >
                <div className="space-y-4 pt-4 border-t">
                  {/* 色盲友好 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">色盲友好</div>
                        <div className="text-sm text-muted-foreground">优化颜色显示</div>
                      </div>
                      <Button
                        variant={settings.colorBlindFriendly ? "default" : "outline"}
                        size="sm"
                        onClick={toggleColorBlindFriendly}
                      >
                        <Palette className="h-4 w-4 mr-2" />
                        {settings.colorBlindFriendly ? '已启用' : '已禁用'}
                      </Button>
                    </div>

                    {settings.colorBlindFriendly && (
                      <div className="ml-4 space-y-2">
                        <div className="text-sm font-medium">色盲类型</div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { type: 'none', label: '无' },
                            { type: 'protanopia', label: '红色盲' },
                            { type: 'deuteranopia', label: '绿色盲' },
                            { type: 'tritanopia', label: '蓝色盲' },
                            { type: 'achromatopsia', label: '全色盲' }
                          ].map(({ type, label }) => (
                            <Button
                              key={type}
                              variant="outline"
                              size="sm"
                              onClick={() => setColorBlindnessType(type as ColorBlindnessType)}
                              className="text-xs"
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 增强焦点指示器 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">增强焦点指示器</div>
                      <div className="text-sm text-muted-foreground">更明显的焦点边框</div>
                    </div>
                    <Button
                      variant={settings.focusIndicatorEnhanced ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateSettings({ 
                        focusIndicatorEnhanced: !settings.focusIndicatorEnhanced 
                      })}
                    >
                      {settings.focusIndicatorEnhanced ? '已启用' : '已禁用'}
                    </Button>
                  </div>

                  {/* 自定义颜色 */}
                  <div className="space-y-2">
                    <div className="font-medium">自定义颜色</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(settings.customColors).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <label className="text-sm capitalize">{key}:</label>
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => updateSettings({
                              customColors: {
                                ...settings.customColors,
                                [key]: e.target.value
                              }
                            })}
                            className="w-8 h-8 rounded border"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AccessibleMotion>
            )}
          </AnimatePresence>
        </div>

        {/* 重置按钮 */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={resetSettings}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            重置所有设置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// 颜色对比度检查器
export const ColorContrastChecker: React.FC<{
  foreground: string;
  background: string;
  className?: string;
}> = ({ foreground, background, className }) => {
  // 计算相对亮度
  const getLuminance = (color: string) => {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  // 计算对比度
  const getContrastRatio = (fg: string, bg: string) => {
    const l1 = getLuminance(fg);
    const l2 = getLuminance(bg);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  const contrastRatio = getContrastRatio(foreground, background);
  const passesAA = contrastRatio >= 4.5;
  const passesAAA = contrastRatio >= 7;

  return (
    <div className={cn('p-3 border rounded-lg', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">对比度检查</span>
        <span className="text-sm">{contrastRatio.toFixed(2)}:1</span>
      </div>
      
      <div className="space-y-1">
        <div className={cn(
          'text-xs px-2 py-1 rounded',
          passesAA ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        )}>
          WCAG AA: {passesAA ? '通过' : '未通过'}
        </div>
        
        <div className={cn(
          'text-xs px-2 py-1 rounded',
          passesAAA ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        )}>
          WCAG AAA: {passesAAA ? '通过' : '未通过'}
        </div>
      </div>
      
      <div 
        className="mt-2 p-2 rounded text-center text-sm"
        style={{ color: foreground, backgroundColor: background }}
      >
        示例文本
      </div>
    </div>
  );
};

export default {
  VisualAssistanceProvider,
  useVisualAssistance,
  AccessibleMotion,
  VisualAssistancePanel,
  ColorContrastChecker
};