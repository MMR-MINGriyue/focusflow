import React from 'react';
import { Theme } from '../../services/themeService';
import { ValidationResult } from '../../utils/themeValidator';

interface ThemeValidationReportProps {
  theme: Theme;
  validation: ValidationResult;
  onClose: () => void;
}

export const ThemeValidationReport: React.FC<ThemeValidationReportProps> = ({
  theme,
  validation,
  onClose
}) => {
  const getContrastLevel = (ratio: number): string => {
    if (ratio >= 7) return '优秀';
    if (ratio >= 4.5) return '良好';
    if (ratio >= 3) return '一般';
    return '较差';
  };

  const getContrastColor = (ratio: number): string => {
    if (ratio >= 7) return 'text-green-600';
    if (ratio >= 4.5) return 'text-blue-600';
    if (ratio >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">主题验证报告</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 基本信息 */}
          <div className="mb-6">
            <h4 className="font-medium mb-2">主题信息</h4>
            <div className="bg-gray-50 rounded p-3 space-y-2">
              <div><span className="font-medium">名称：</span>{theme.name}</div>
              <div><span className="font-medium">描述：</span>{theme.description}</div>
              <div><span className="font-medium">类型：</span>{theme.type}</div>
            </div>
          </div>

          {/* 验证状态 */}
          <div className="mb-6">
            <h4 className="font-medium mb-2">验证状态</h4>
            <div className={`rounded p-3 ${validation.isValid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {validation.isValid ? '✓ 主题格式正确' : '✗ 主题格式存在问题'}
            </div>
          </div>

          {/* 错误信息 */}
          {validation.errors.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium mb-2 text-red-600">错误信息</h4>
              <div className="bg-red-50 rounded p-3">
                <ul className="list-disc list-inside space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index} className="text-red-700 text-sm">{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 警告信息 */}
          {validation.warnings.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium mb-2 text-yellow-600">警告信息</h4>
              <div className="bg-yellow-50 rounded p-3">
                <ul className="list-disc list-inside space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index} className="text-yellow-700 text-sm">{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 颜色对比度分析 */}
          {validation.report?.contrastAnalysis && (
            <div className="mb-6">
              <h4 className="font-medium mb-2">颜色对比度分析</h4>
              <div className="space-y-3">
                {Object.entries(validation.report.contrastAnalysis).map(([pair, analysis]) => (
                  <div key={pair} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{pair}</span>
                      <span className={`text-sm font-medium ${getContrastColor(analysis.ratio)}`}>
                        {analysis.ratio.toFixed(2)}:1 ({getContrastLevel(analysis.ratio)})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: analysis.foreground }}
                      />
                      <span className="text-xs">前景色</span>
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: analysis.background }}
                      />
                      <span className="text-xs">背景色</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 颜色信息 */}
          <div className="mb-6">
            <h4 className="font-medium mb-2">颜色配置</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded border" style={{ backgroundColor: theme.colors.primary }} /><span>主色: {theme.colors.primary}</span></div>
              <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded border" style={{ backgroundColor: theme.colors.background }} /><span>背景: {theme.colors.background}</span></div>
              <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded border" style={{ backgroundColor: theme.colors.text }} /><span>文本: {theme.colors.text}</span></div>
              <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded border" style={{ backgroundColor: theme.colors.accent }} /><span>强调: {theme.colors.accent}</span></div>
              <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded border" style={{ backgroundColor: theme.colors.border }} /><span>边框: {theme.colors.border}</span></div>
              <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded border" style={{ backgroundColor: theme.colors.error }} /><span>错误: {theme.colors.error}</span></div>
              <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded border" style={{ backgroundColor: theme.colors.success }} /><span>成功: {theme.colors.success}</span></div>
              <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded border" style={{ backgroundColor: theme.colors.warning }} /><span>警告: {theme.colors.warning}</span></div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};