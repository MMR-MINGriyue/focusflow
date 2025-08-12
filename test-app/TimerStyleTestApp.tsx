import React, { useState, useEffect } from 'react';
import NotificationManager from './components/NotificationManager';
import ConfirmDialog from './components/ConfirmDialog';
import StyleEditor from './components/StyleEditor';

// 定义TimerStyleConfig接口，避免导入问题
interface TimerStyleConfig {
  id: string;
  name: string;
  description: string;
  displayStyle: string;
  size: string;
  numberStyle: string;
  progressStyle: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
    progress: string;
    progressBackground: string;
  };
  layout: {
    alignment: string;
    spacing: string;
    showStatusIndicator: boolean;
    showProgressPercentage: boolean;
    showStateText: boolean;
  };
  animations: {
    enabled: boolean;
    transitionDuration: number;
    easing: string;
    pulseOnStateChange: boolean;
    breathingEffect: boolean;
    rotationEffect: boolean;
  };
  background: {
    pattern: string;
    opacity: number;
    color: string;
    size: string;
    animation: boolean;
  };
  particles: {
    effect: string;
    count: number;
    size: number;
    speed: number;
    color: string;
    opacity: number;
  };
  decoration: {
    element: string;
    intensity: number;
    color: string;
    animated: boolean;
  };
  responsive: {
    enabled: boolean;
    breakpoints: {
      mobile: any;
      tablet: any;
      desktop: any;
    };
  };
  isPreset: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// 模拟TimerStyleManager组件，因为我们无法直接导入
const TimerStyleManager: React.FC<{ onStyleChange?: (style: TimerStyleConfig) => void }> = ({ onStyleChange }) => {
  // 模拟一些样式数据
  const mockStyles: TimerStyleConfig[] = [
    {
      id: 'digital-modern',
      name: '现代数字',
      description: '简洁现代的数字显示风格',
      displayStyle: 'digital',
      size: 'large',
      numberStyle: 'standard',
      progressStyle: 'linear',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        background: '#ffffff',
        text: '#1e293b',
        accent: '#06b6d4',
        progress: '#10b981',
        progressBackground: '#e5e7eb'
      },
      layout: {
        alignment: 'center',
        spacing: 'normal',
        showStatusIndicator: true,
        showProgressPercentage: true,
        showStateText: true
      },
      animations: {
        enabled: true,
        transitionDuration: 300,
        easing: 'ease-in-out',
        pulseOnStateChange: true,
        breathingEffect: false,
        rotationEffect: false
      },
      background: {
        pattern: 'none',
        opacity: 0.1,
        color: '#f3f4f6',
        size: 'medium',
        animation: false
      },
      particles: {
        effect: 'none',
        count: 20,
        size: 2,
        speed: 1,
        color: '#3b82f6',
        opacity: 0.3
      },
      decoration: {
        element: 'none',
        intensity: 0.5,
        color: '#3b82f6',
        animated: false
      },
      responsive: {
        enabled: true,
        breakpoints: {
          mobile: { size: 'medium' },
          tablet: { size: 'large' },
          desktop: { size: 'large' }
        }
      },
      isPreset: true,
      category: 'modern',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'analog-classic',
      name: '经典模拟',
      description: '传统模拟时钟风格',
      displayStyle: 'analog',
      size: 'large',
      numberStyle: 'standard',
      progressStyle: 'circular',
      colors: {
        primary: '#dc2626',
        secondary: '#64748b',
        background: '#f8fafc',
        text: '#374151',
        accent: '#f59e0b',
        progress: '#ef4444',
        progressBackground: '#f3f4f6'
      },
      layout: {
        alignment: 'center',
        spacing: 'normal',
        showStatusIndicator: true,
        showProgressPercentage: false,
        showStateText: true
      },
      animations: {
        enabled: true,
        transitionDuration: 500,
        easing: 'ease-out',
        pulseOnStateChange: false,
        breathingEffect: false,
        rotationEffect: true
      },
      background: {
        pattern: 'grid',
        opacity: 0.05,
        color: '#dc2626',
        size: 'large',
        animation: false
      },
      particles: {
        effect: 'none',
        count: 15,
        size: 3,
        speed: 0.5,
        color: '#dc2626',
        opacity: 0.2
      },
      decoration: {
        element: 'frame',
        intensity: 0.3,
        color: '#dc2626',
        animated: false
      },
      responsive: {
        enabled: true,
        breakpoints: {
          mobile: { size: 'medium' },
          tablet: { size: 'large' },
          desktop: { size: 'extra-large' }
        }
      },
      isPreset: true,
      category: 'classic',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const [selectedStyle, setSelectedStyle] = useState<TimerStyleConfig>(mockStyles[0]);

  const handleStyleSelect = (style: TimerStyleConfig) => {
    setSelectedStyle(style);
    onStyleChange?.(style);
  };

  return (
    <div className="space-y-8 p-6 animate-mac-slide-in">
      <div className="mac-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-mac">
              <div className="h-6 w-6 text-blue-600">⏱️</div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold font-system text-gray-900">
                计时器样式管理
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                自定义您的计时器外观和动画效果
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mac-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-mac border-2 border-white shadow-mac"
                style={{ backgroundColor: selectedStyle.colors.primary }}
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <div className="font-semibold font-system text-gray-900 text-lg">
                {selectedStyle.name}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {selectedStyle.description} • {selectedStyle.displayStyle}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mac-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-semibold font-system text-gray-900">
            可用样式
          </h4>
          <div className="mac-badge-primary">
            {mockStyles.length} 个样式
          </div>
        </div>

        <div className="space-y-4">
          {mockStyles.map((style) => (
            <div key={style.id} className="mac-card hover:shadow-mac-lg transition-all duration-300 ease-mac">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-mac border-2 border-white shadow-mac"
                        style={{ backgroundColor: style.colors.primary }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold font-system text-gray-900">{style.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{style.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {style.displayStyle} • {style.size} • {style.numberStyle}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleStyleSelect(style)}
                      className="mac-button-primary text-xs px-3 py-1"
                    >
                      应用
                    </button>
                    <button
                      title="预览样式"
                      className="p-2 mac-button-ghost"
                    >
                      👁️
                    </button>
                    <button
                      title="编辑样式"
                      className="p-2 mac-button-ghost"
                    >
                      ✏️
                    </button>
                    <button
                      title="复制样式"
                      className="p-2 mac-button-ghost"
                    >
                      📋
                    </button>
                    <button
                      title="导出样式"
                      className="p-2 mac-button-ghost"
                    >
                      📥
                    </button>
                    <button
                      title="删除样式"
                      className="p-2 text-red-600 hover:text-red-700 mac-button-ghost"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TimerStyleTestApp: React.FC = () => {
  const [currentStyle, setCurrentStyle] = useState<TimerStyleConfig | null>(null);
  const [showManager, setShowManager] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [styleToDelete, setStyleToDelete] = useState<TimerStyleConfig | null>(null);
  const [styleToEdit, setStyleToEdit] = useState<TimerStyleConfig | null>(null);
  const [styles, setStyles] = useState<TimerStyleConfig[]>([]);

  // 初始化样式数据
  useEffect(() => {
    const mockStyles: TimerStyleConfig[] = [
      {
        id: 'digital-modern',
        name: '现代数字',
        description: '简洁现代的数字显示风格',
        displayStyle: 'digital',
        size: 'large',
        numberStyle: 'standard',
        progressStyle: 'linear',
        colors: {
          primary: '#3b82f6',
          secondary: '#64748b',
          background: '#ffffff',
          text: '#1e293b',
          accent: '#06b6d4',
          progress: '#10b981',
          progressBackground: '#e5e7eb'
        },
        layout: {
          alignment: 'center',
          spacing: 'normal',
          showStatusIndicator: true,
          showProgressPercentage: true,
          showStateText: true
        },
        animations: {
          enabled: true,
          transitionDuration: 300,
          easing: 'ease-in-out',
          pulseOnStateChange: true,
          breathingEffect: false,
          rotationEffect: false
        },
        background: {
          pattern: 'none',
          opacity: 0.1,
          color: '#f3f4f6',
          size: 'medium',
          animation: false
        },
        particles: {
          effect: 'none',
          count: 20,
          size: 2,
          speed: 1,
          color: '#3b82f6',
          opacity: 0.3
        },
        decoration: {
          element: 'none',
          intensity: 0.5,
          color: '#3b82f6',
          animated: false
        },
        responsive: {
          enabled: true,
          breakpoints: {
            mobile: { size: 'medium' },
            tablet: { size: 'large' },
            desktop: { size: 'large' }
          }
        },
        isPreset: true,
        category: 'modern',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'analog-classic',
        name: '经典模拟',
        description: '传统模拟时钟风格',
        displayStyle: 'analog',
        size: 'large',
        numberStyle: 'standard',
        progressStyle: 'circular',
        colors: {
          primary: '#dc2626',
          secondary: '#64748b',
          background: '#f8fafc',
          text: '#374151',
          accent: '#f59e0b',
          progress: '#ef4444',
          progressBackground: '#f3f4f6'
        },
        layout: {
          alignment: 'center',
          spacing: 'normal',
          showStatusIndicator: true,
          showProgressPercentage: false,
          showStateText: true
        },
        animations: {
          enabled: true,
          transitionDuration: 500,
          easing: 'ease-out',
          pulseOnStateChange: false,
          breathingEffect: false,
          rotationEffect: true
        },
        background: {
          pattern: 'grid',
          opacity: 0.05,
          color: '#dc2626',
          size: 'large',
          animation: false
        },
        particles: {
          effect: 'none',
          count: 15,
          size: 3,
          speed: 0.5,
          color: '#dc2626',
          opacity: 0.2
        },
        decoration: {
          element: 'frame',
          intensity: 0.3,
          color: '#dc2626',
          animated: false
        },
        responsive: {
          enabled: true,
          breakpoints: {
            mobile: { size: 'medium' },
            tablet: { size: 'large' },
            desktop: { size: 'extra-large' }
          }
        },
        isPreset: true,
        category: 'classic',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    setStyles(mockStyles);
    setCurrentStyle(mockStyles[0]);
  }, []);

  const handleStyleChange = (style: TimerStyleConfig) => {
    setCurrentStyle(style);
    console.log('样式已更改:', style.name);
    if (window.showNotification) {
      window.showNotification(`已应用样式: ${style.name}`, 'success');
    }
  };

  const handlePreviewStyle = (style: TimerStyleConfig) => {
    console.log('预览样式:', style.name);
    if (window.showNotification) {
      window.showNotification(`预览样式: ${style.name}`, 'info');
    }
  };

  const handleCopyStyle = (style: TimerStyleConfig) => {
    const newStyle = {
      ...style,
      id: `${style.id}-copy-${Date.now()}`,
      name: `${style.name} (副本)`,
      isPreset: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setStyles([...styles, newStyle]);
    console.log('复制样式:', style.name);
    if (window.showNotification) {
      window.showNotification(`已复制样式: ${style.name}`, 'success');
    }
  };

  const handleExportStyle = (style: TimerStyleConfig) => {
    const dataStr = JSON.stringify(style, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `${style.name.replace(/\s+/g, '-')}-style.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    console.log('导出样式:', style.name);
    if (window.showNotification) {
      window.showNotification(`已导出样式: ${style.name}`, 'success');
    }
  };

  const handleEditStyle = (style: TimerStyleConfig) => {
    setStyleToEdit(style);
    setShowStyleEditor(true);
    console.log('编辑样式:', style.name);
  };

  const handleSaveStyle = (style: TimerStyleConfig) => {
    const updatedStyles = styles.map(s => s.id === style.id ? style : s);
    setStyles(updatedStyles);

    if (currentStyle && currentStyle.id === style.id) {
      setCurrentStyle(style);
    }

    setShowStyleEditor(false);
    setStyleToEdit(null);
    console.log('保存样式:', style.name);
    if (window.showNotification) {
      window.showNotification(`已保存样式: ${style.name}`, 'success');
    }
  };

  const handleDeleteStyle = (style: TimerStyleConfig) => {
    setStyleToDelete(style);
    setShowConfirmDialog(true);
  };

  const confirmDeleteStyle = () => {
    if (styleToDelete) {
      const updatedStyles = styles.filter(s => s.id !== styleToDelete.id);
      setStyles(updatedStyles);

      if (currentStyle && currentStyle.id === styleToDelete.id) {
        setCurrentStyle(updatedStyles.length > 0 ? updatedStyles[0] : null);
      }

      setShowConfirmDialog(false);
      setStyleToDelete(null);
      console.log('删除样式:', styleToDelete.name);
      if (window.showNotification) {
        window.showNotification(`已删除样式: ${styleToDelete.name}`, 'success');
      }
    }
  };

  const cancelDeleteStyle = () => {
    setShowConfirmDialog(false);
    setStyleToDelete(null);
  };

  // 模拟TimerStyleManager组件
  const TimerStyleManager: React.FC<{ onStyleChange?: (style: TimerStyleConfig) => void }> = ({ onStyleChange }) => {
    const [selectedStyle, setSelectedStyle] = useState<TimerStyleConfig>(currentStyle || styles[0]);

    const handleStyleSelect = (style: TimerStyleConfig) => {
      setSelectedStyle(style);
      onStyleChange?.(style);
    };

    return (
      <div className="space-y-8 p-6 animate-mac-slide-in">
        <div className="mac-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-mac">
                <div className="h-6 w-6 text-blue-600">⏱️</div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold font-system text-gray-900">
                  计时器样式管理
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  自定义您的计时器外观和动画效果
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mac-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-mac border-2 border-white shadow-mac"
                  style={{ backgroundColor: selectedStyle.colors.primary }}
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <div className="font-semibold font-system text-gray-900 text-lg">
                  {selectedStyle.name}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedStyle.description} • {selectedStyle.displayStyle}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mac-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-semibold font-system text-gray-900">
              可用样式
            </h4>
            <div className="mac-badge-primary">
              {styles.length} 个样式
            </div>
          </div>

          <div className="space-y-4">
            {styles.map((style) => (
              <div key={style.id} className="mac-card hover:shadow-mac-lg transition-all duration-300 ease-mac">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="relative">
                        <div
                          className="w-10 h-10 rounded-mac border-2 border-white shadow-mac"
                          style={{ backgroundColor: style.colors.primary }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold font-system text-gray-900">{style.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{style.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {style.displayStyle} • {style.size} • {style.numberStyle}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleStyleSelect(style)}
                        className="mac-button-primary text-xs px-3 py-1"
                      >
                        应用
                      </button>
                      <button
                        onClick={() => handlePreviewStyle(style)}
                        title="预览样式"
                        className="p-2 mac-button-ghost"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEditStyle(style)}
                        title="编辑样式"
                        className="p-2 mac-button-ghost"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleCopyStyle(style)}
                        title="复制样式"
                        className="p-2 mac-button-ghost"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => handleExportStyle(style)}
                        title="导出样式"
                        className="p-2 mac-button-ghost"
                      >
                        📥
                      </button>
                      <button
                        onClick={() => handleDeleteStyle(style)}
                        title="删除样式"
                        className="p-2 text-red-600 hover:text-red-700 mac-button-ghost"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="test-app">
      <NotificationManager />
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="确认删除"
        message={`确定要删除样式 "${styleToDelete?.name}" 吗？此操作不可撤销。`}
        onConfirm={confirmDeleteStyle}
        onCancel={cancelDeleteStyle}
      />
      <StyleEditor
        isOpen={showStyleEditor}
        style={styleToEdit}
        onSave={handleSaveStyle}
        onCancel={() => {
          setShowStyleEditor(false);
          setStyleToEdit(null);
        }}
      />

      <div className="test-controls">
        <button 
          onClick={() => setShowManager(!showManager)}
          className="control-button"
        >
          {showManager ? '隐藏样式管理器' : '显示样式管理器'}
        </button>
      </div>

      {showManager && (
        <div className="manager-container">
          <TimerStyleManager onStyleChange={handleStyleChange} />
        </div>
      )}

      <div className="preview-container">
        <h2>当前样式预览</h2>
        {currentStyle ? (
          <div className="style-preview">
            <h3>{currentStyle.name}</h3>
            <p>{currentStyle.description}</p>
            <div className="style-details">
              <p><strong>显示风格:</strong> {currentStyle.displayStyle}</p>
              <p><strong>尺寸:</strong> {currentStyle.size}</p>
              <p><strong>数字风格:</strong> {currentStyle.numberStyle}</p>
              <p><strong>进度风格:</strong> {currentStyle.progressStyle}</p>
            </div>
            <div className="color-preview">
              <h4>颜色预览</h4>
              <div className="color-grid">
                <div className="color-item" style={{ backgroundColor: currentStyle.colors.primary }}>
                  <span>主色</span>
                </div>
                <div className="color-item" style={{ backgroundColor: currentStyle.colors.secondary }}>
                  <span>次要色</span>
                </div>
                <div className="color-item" style={{ backgroundColor: currentStyle.colors.background }}>
                  <span>背景色</span>
                </div>
                <div className="color-item" style={{ backgroundColor: currentStyle.colors.text }}>
                  <span>文本色</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p>未选择样式</p>
        )}
      </div>
    </div>
  );
};

export default TimerStyleTestApp;