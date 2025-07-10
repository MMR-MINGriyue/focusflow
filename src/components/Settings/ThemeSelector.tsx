import React, { useState, useEffect } from 'react';
import { Palette, Check, Download, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { themeService } from '../../services/theme';
import { Theme } from '../../types/theme';

interface ThemeSelectorProps {
  onThemeChange?: (theme: Theme) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onThemeChange }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeService.getCurrentTheme());
  const [themes, setThemes] = useState<Theme[]>(themeService.getAllThemes());
  const [showImportExport, setShowImportExport] = useState(false);

  useEffect(() => {
    const handleThemeChange = (theme: Theme) => {
      setCurrentTheme(theme);
      onThemeChange?.(theme);
    };

    themeService.addListener(handleThemeChange);
    return () => themeService.removeListener(handleThemeChange);
  }, [onThemeChange]);

  const handleThemeSelect = (themeId: string) => {
    themeService.setTheme(themeId);
  };

  const exportCurrentTheme = () => {
    const themeJson = themeService.exportTheme(currentTheme);
    const blob = new Blob([themeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTheme.id}-theme.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const themeJson = e.target?.result as string;
        const importedTheme = themeService.importTheme(themeJson);
        if (importedTheme) {
          setThemes(themeService.getAllThemes());
          alert(`主题 "${importedTheme.name}" 导入成功！`);
        } else {
          alert('主题导入失败，请检查文件格式');
        }
      } catch (error) {
        alert('主题导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
    
    // 清空文件输入
    event.target.value = '';
  };

  const ThemePreview: React.FC<{ theme: Theme; isSelected: boolean }> = ({ theme, isSelected }) => {
    const previewStyle = themeService.getThemePreviewStyle(theme);
    const previewElements = themeService.getThemePreviewElements(theme);

    return (
      <div
        className={`relative cursor-pointer transition-all duration-200 hover:scale-105 ${
          isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
        }`}
        style={previewStyle}
        onClick={() => handleThemeSelect(theme.id)}
      >
        {/* 主题名称 */}
        <div className="text-sm font-medium mb-2">{theme.name}</div>
        
        {/* 颜色预览 */}
        <div className="flex space-x-1 mb-2">
          <div
            className="w-4 h-4 rounded-full"
            style={previewElements.primary}
            title="主要颜色"
          />
          <div
            className="w-4 h-4 rounded-full"
            style={previewElements.focus}
            title="专注颜色"
          />
          <div
            className="w-4 h-4 rounded-full"
            style={previewElements.break}
            title="休息颜色"
          />
          <div
            className="w-4 h-4 rounded-full"
            style={previewElements.microBreak}
            title="微休息颜色"
          />
        </div>
        
        {/* 描述 */}
        <div className="text-xs opacity-70">{theme.description}</div>
        
        {/* 选中标识 */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <Check className="h-4 w-4 text-blue-500" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Palette className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">主题设置</h3>
        </div>
        <Button
          type="button"
          onClick={() => setShowImportExport(!showImportExport)}
          size="sm"
          variant="outline"
          className="text-xs"
        >
          {showImportExport ? '隐藏' : '导入/导出'}
        </Button>
      </div>

      {/* 当前主题信息 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: currentTheme.colors.primary }}
          />
          <div>
            <div className="font-medium text-gray-700">{currentTheme.name}</div>
            <div className="text-sm text-gray-500">{currentTheme.description}</div>
          </div>
        </div>
      </div>

      {/* 主题网格 */}
      <div className="grid grid-cols-2 gap-4">
        {themes.map((theme) => (
          <ThemePreview
            key={theme.id}
            theme={theme}
            isSelected={theme.id === currentTheme.id}
          />
        ))}
      </div>

      {/* 导入/导出功能 */}
      {showImportExport && (
        <div className="border-t pt-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">主题管理</h4>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              onClick={exportCurrentTheme}
              size="sm"
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="h-3 w-3" />
              <span>导出当前主题</span>
            </Button>
            
            <label className="inline-flex items-center space-x-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded cursor-pointer hover:bg-blue-100 transition-colors">
              <Upload className="h-3 w-3" />
              <span>导入主题</span>
              <input
                type="file"
                accept=".json"
                onChange={importTheme}
                className="hidden"
              />
            </label>
          </div>
          
          <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded">
            <p><strong>提示：</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>导出的主题文件为 JSON 格式</li>
              <li>可以与其他用户分享主题文件</li>
              <li>导入的主题会自动添加到主题列表中</li>
              <li>自定义主题支持完全的颜色和样式定制</li>
            </ul>
          </div>
        </div>
      )}

      {/* 主题类型说明 */}
      <div className="text-xs text-gray-500 space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="font-medium mb-1">浅色主题</div>
            <div>适合白天使用，明亮清晰</div>
          </div>
          <div>
            <div className="font-medium mb-1">深色主题</div>
            <div>适合夜间使用，护眼舒适</div>
          </div>
          <div>
            <div className="font-medium mb-1">护眼主题</div>
            <div>减少蓝光，缓解眼部疲劳</div>
          </div>
          <div>
            <div className="font-medium mb-1">高对比度</div>
            <div>提升可读性，适合视力不佳用户</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
