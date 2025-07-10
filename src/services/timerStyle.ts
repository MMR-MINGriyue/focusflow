import { 
  TimerStyleConfig, 
  TimerStyleSettings, 
  DEFAULT_TIMER_STYLES,
  getStyleById,
  validateStyleConfig
} from '../types/timerStyle';

class TimerStyleService {
  private settings: TimerStyleSettings;
  private listeners: ((settings: TimerStyleSettings) => void)[] = [];

  constructor() {
    this.settings = this.getDefaultSettings();
    this.loadSettings();
  }

  /**
   * 获取默认设置
   */
  private getDefaultSettings(): TimerStyleSettings {
    return {
      currentStyleId: 'digital-modern',
      customStyles: [],
      previewMode: false,
      autoSwitchByState: false
    };
  }

  /**
   * 获取当前设置
   */
  getSettings(): TimerStyleSettings {
    return { ...this.settings };
  }

  /**
   * 获取当前样式配置
   */
  getCurrentStyle(): TimerStyleConfig {
    const style = getStyleById(this.settings.currentStyleId, this.settings.customStyles);
    return style || DEFAULT_TIMER_STYLES[0];
  }

  /**
   * 获取所有可用样式
   */
  getAllStyles(): TimerStyleConfig[] {
    return [...DEFAULT_TIMER_STYLES, ...this.settings.customStyles];
  }

  /**
   * 获取预设样式
   */
  getPresetStyles(): TimerStyleConfig[] {
    return DEFAULT_TIMER_STYLES;
  }

  /**
   * 获取自定义样式
   */
  getCustomStyles(): TimerStyleConfig[] {
    return [...this.settings.customStyles];
  }

  /**
   * 设置当前样式
   */
  setCurrentStyle(styleId: string): boolean {
    const style = getStyleById(styleId, this.settings.customStyles);
    if (!style) {
      console.warn(`Style with id "${styleId}" not found`);
      return false;
    }

    this.settings.currentStyleId = styleId;
    this.settings.previewMode = false;
    this.settings.previewStyleId = undefined;
    
    this.saveSettings();
    this.notifyListeners();
    this.applyStyle(style);
    
    return true;
  }

  /**
   * 预览样式
   */
  previewStyle(styleId: string): boolean {
    const style = getStyleById(styleId, this.settings.customStyles);
    if (!style) {
      console.warn(`Style with id "${styleId}" not found`);
      return false;
    }

    this.settings.previewMode = true;
    this.settings.previewStyleId = styleId;
    
    this.notifyListeners();
    this.applyStyle(style);
    
    return true;
  }

  /**
   * 退出预览模式
   */
  exitPreview(): void {
    if (!this.settings.previewMode) return;

    this.settings.previewMode = false;
    this.settings.previewStyleId = undefined;
    
    const currentStyle = this.getCurrentStyle();
    this.notifyListeners();
    this.applyStyle(currentStyle);
  }

  /**
   * 检查是否在预览模式
   */
  isInPreviewMode(): boolean {
    return this.settings.previewMode;
  }

  /**
   * 获取预览样式
   */
  getPreviewStyle(): TimerStyleConfig | null {
    if (!this.settings.previewMode || !this.settings.previewStyleId) {
      return null;
    }
    return getStyleById(this.settings.previewStyleId, this.settings.customStyles);
  }

  /**
   * 添加自定义样式
   */
  addCustomStyle(style: TimerStyleConfig): boolean {
    if (!validateStyleConfig(style)) {
      console.error('Invalid style configuration');
      return false;
    }

    // 检查ID是否已存在
    const existingIndex = this.settings.customStyles.findIndex(s => s.id === style.id);
    if (existingIndex >= 0) {
      // 更新现有样式
      this.settings.customStyles[existingIndex] = {
        ...style,
        updatedAt: new Date().toISOString()
      };
    } else {
      // 添加新样式
      this.settings.customStyles.push({
        ...style,
        isPreset: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    this.saveSettings();
    this.notifyListeners();
    return true;
  }

  /**
   * 删除自定义样式
   */
  removeCustomStyle(styleId: string): boolean {
    const index = this.settings.customStyles.findIndex(s => s.id === styleId);
    if (index === -1) {
      return false;
    }

    this.settings.customStyles.splice(index, 1);

    // 如果删除的是当前样式，切换到默认样式
    if (this.settings.currentStyleId === styleId) {
      this.settings.currentStyleId = DEFAULT_TIMER_STYLES[0].id;
    }

    this.saveSettings();
    this.notifyListeners();
    return true;
  }

  /**
   * 复制样式
   */
  duplicateStyle(styleId: string, newName?: string): TimerStyleConfig | null {
    const sourceStyle = getStyleById(styleId, this.settings.customStyles);
    if (!sourceStyle) {
      return null;
    }

    const duplicatedStyle: TimerStyleConfig = {
      ...sourceStyle,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: newName || `${sourceStyle.name} (副本)`,
      isPreset: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.addCustomStyle(duplicatedStyle)) {
      return duplicatedStyle;
    }

    return null;
  }

  /**
   * 导出样式配置
   */
  exportStyle(styleId: string): string | null {
    const style = getStyleById(styleId, this.settings.customStyles);
    if (!style) {
      return null;
    }

    const exportData = {
      ...style,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入样式配置
   */
  importStyle(styleJson: string): TimerStyleConfig | null {
    try {
      const styleData = JSON.parse(styleJson);
      
      // 验证数据格式
      if (!validateStyleConfig(styleData)) {
        throw new Error('Invalid style format');
      }

      // 生成新的ID避免冲突
      const importedStyle: TimerStyleConfig = {
        ...styleData,
        id: `imported_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        isPreset: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (this.addCustomStyle(importedStyle)) {
        return importedStyle;
      }

      return null;
    } catch (error) {
      console.error('Failed to import style:', error);
      return null;
    }
  }

  /**
   * 设置状态样式映射
   */
  setStateStyles(stateStyles: { focus: string; break: string; microBreak: string }): void {
    this.settings.stateStyles = stateStyles;
    this.settings.autoSwitchByState = true;
    this.saveSettings();
    this.notifyListeners();
  }

  /**
   * 启用/禁用状态自动切换
   */
  setAutoSwitchByState(enabled: boolean): void {
    this.settings.autoSwitchByState = enabled;
    this.saveSettings();
    this.notifyListeners();
  }

  /**
   * 根据状态获取样式
   */
  getStyleForState(state: 'focus' | 'break' | 'microBreak'): TimerStyleConfig {
    if (this.settings.autoSwitchByState && this.settings.stateStyles) {
      const styleId = this.settings.stateStyles[state];
      const style = getStyleById(styleId, this.settings.customStyles);
      if (style) {
        return style;
      }
    }
    return this.getCurrentStyle();
  }

  /**
   * 应用样式到DOM
   */
  private applyStyle(style: TimerStyleConfig): void {
    const root = document.documentElement;
    
    // 应用CSS变量
    Object.entries(style.colors).forEach(([key, value]) => {
      root.style.setProperty(`--timer-${key}`, value);
    });

    // 应用其他样式属性
    root.style.setProperty('--timer-font-size', style.fontSize || this.getSizeValue(style.size));
    root.style.setProperty('--timer-font-weight', style.fontWeight || this.getNumberStyleWeight(style.numberStyle));
    root.style.setProperty('--timer-font-family', style.fontFamily || this.getNumberStyleFamily(style.numberStyle));
    root.style.setProperty('--timer-transition-duration', `${style.animations.transitionDuration}ms`);
    root.style.setProperty('--timer-transition-easing', style.animations.easing);

    // 应用自定义CSS
    if (style.customCSS) {
      this.applyCustomCSS(style.customCSS);
    }
  }

  /**
   * 获取尺寸对应的字体大小
   */
  private getSizeValue(size: TimerStyleConfig['size']): string {
    const sizeMap = {
      'small': '2rem',
      'medium': '3rem',
      'large': '4rem',
      'extra-large': '6rem'
    };
    return sizeMap[size];
  }

  /**
   * 获取数字样式对应的字体粗细
   */
  private getNumberStyleWeight(style: TimerStyleConfig['numberStyle']): string {
    const weightMap = {
      'standard': '400',
      'mono': '400',
      'digital': '700',
      'handwritten': '400',
      'bold': '700',
      'thin': '200'
    };
    return weightMap[style];
  }

  /**
   * 获取数字样式对应的字体族
   */
  private getNumberStyleFamily(style: TimerStyleConfig['numberStyle']): string {
    const familyMap = {
      'standard': 'system-ui, sans-serif',
      'mono': 'ui-monospace, monospace',
      'digital': '"Courier New", monospace',
      'handwritten': '"Comic Sans MS", cursive',
      'bold': 'system-ui, sans-serif',
      'thin': 'system-ui, sans-serif'
    };
    return familyMap[style];
  }

  /**
   * 应用自定义CSS
   */
  private applyCustomCSS(css: string): void {
    const styleId = 'timer-custom-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = css;
  }

  /**
   * 添加监听器
   */
  addListener(listener: (settings: TimerStyleSettings) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除监听器
   */
  removeListener(listener: (settings: TimerStyleSettings) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.settings));
  }

  /**
   * 保存设置到本地存储
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('focusflow-timer-style-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save timer style settings:', error);
    }
  }

  /**
   * 从本地存储加载设置
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('focusflow-timer-style-settings');
      if (saved) {
        const settings = JSON.parse(saved) as TimerStyleSettings;
        this.settings = { ...this.getDefaultSettings(), ...settings };
        
        // 验证当前样式是否存在
        const currentStyle = getStyleById(this.settings.currentStyleId, this.settings.customStyles);
        if (!currentStyle) {
          this.settings.currentStyleId = DEFAULT_TIMER_STYLES[0].id;
        }
        
        // 应用当前样式
        this.applyStyle(this.getCurrentStyle());
      }
    } catch (error) {
      console.warn('Failed to load timer style settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }
}

// 创建单例实例
export const timerStyleService = new TimerStyleService();
