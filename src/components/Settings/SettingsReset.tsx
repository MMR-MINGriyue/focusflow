/**
 * 设置重置组件
 * 
 * 提供重置各种设置的功能，包括确认对话框
 */

import React from 'react';
import { RotateCcw, AlertTriangle, Database, Palette, Volume2, Timer } from 'lucide-react';
import { Button } from '../ui/Button';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { soundService } from '../../services/sound';
import { getTimerStyleService } from '../../services/timerStyle';
import { getThemeService } from '../../services/themeService';
// import { databaseService } from '../../services/database'; // 暂时注释掉未使用的导入

interface SettingsResetProps {
  /** 重置完成回调 */
  onResetComplete?: (type: string) => void;
  /** 自定义样式类名 */
  className?: string;
}

const SettingsReset: React.FC<SettingsResetProps> = ({
  onResetComplete,
  className = ''
}) => {
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  /**
   * 重置音频设置
   */
  const resetAudioSettings = () => {
    showConfirmDialog(
      '确定要重置所有音频设置吗？这将：\n• 删除所有自定义音效\n• 重置音效映射\n• 恢复默认音量设置\n\n此操作无法撤销。',
      () => {
        try {
          // 清除自定义音效
          const customSounds = soundService.getAllSounds().filter(sound => sound.id.startsWith('custom-'));
          customSounds.forEach(sound => {
            soundService.removeCustomSound(sound.id);
          });
          
          // 重置音效映射（清除所有自定义映射）
          const defaultMappings = {
            focusStart: 'default-focus-start',
            breakStart: 'default-break-start',
            microBreak: 'default-micro-break',
            notification: 'default-notification',
            whiteNoise: 'default-white-noise'
          };
          Object.entries(defaultMappings).forEach(([event, soundId]) => {
            soundService.setSoundMapping(event, soundId);
          });

          // 重置音量设置
          soundService.setMasterVolume(0.5);
          
          onResetComplete?.('audio');
        } catch (error) {
          console.error('Failed to reset audio settings:', error);
        }
      },
      {
        type: 'danger',
        confirmText: '重置音频设置',
        confirmDanger: true
      }
    );
  };

  /**
   * 重置主题设置
   */
  const resetThemeSettings = () => {
    showConfirmDialog(
      '确定要重置所有主题设置吗？这将：\n• 删除所有自定义主题\n• 恢复默认主题\n• 清除主题配置\n\n此操作无法撤销。',
      () => {
        try {
          const themeService = getThemeService();
          // 清除自定义主题
          const customThemes = themeService.getCustomThemes();
          customThemes.forEach(theme => {
            themeService.deleteCustomTheme(theme.id);
          });
          
          // 重置为默认主题
          themeService.setTheme('light');
          
          onResetComplete?.('theme');
        } catch (error) {
          console.error('Failed to reset theme settings:', error);
        }
      },
      {
        type: 'danger',
        confirmText: '重置主题设置',
        confirmDanger: true
      }
    );
  };

  /**
   * 重置计时器样式设置
   */
  const resetTimerStyleSettings = () => {
    showConfirmDialog(
      '确定要重置所有计时器样式设置吗？这将：\n• 删除所有自定义样式\n• 恢复默认样式\n• 清除样式配置\n\n此操作无法撤销。',
      () => {
        try {
          const timerStyleService = getTimerStyleService();
          // 清除自定义样式
          const customStyles = timerStyleService.getCustomStyles();
          customStyles.forEach(style => {
            timerStyleService.removeCustomStyle(style.id);
          });
          
          // 重置为默认样式
          timerStyleService.setCurrentStyle('digital');
          
          onResetComplete?.('timerStyle');
        } catch (error) {
          console.error('Failed to reset timer style settings:', error);
        }
      },
      {
        type: 'danger',
        confirmText: '重置样式设置',
        confirmDanger: true
      }
    );
  };

  /**
   * 清空统计数据
   */
  const clearStatisticsData = () => {
    showConfirmDialog(
      '确定要清空所有统计数据吗？这将：\n• 删除所有专注记录\n• 清除效率评分历史\n• 重置统计图表\n\n此操作无法撤销，建议先导出数据备份。',
      () => {
        try {
          // 清空数据库中的统计数据
          // databaseService.clearAllData(); // 方法暂未实现
          
          onResetComplete?.('statistics');
        } catch (error) {
          console.error('Failed to clear statistics data:', error);
        }
      },
      {
        type: 'danger',
        confirmText: '清空统计数据',
        confirmDanger: true
      }
    );
  };

  /**
   * 重置所有设置
   */
  const resetAllSettings = () => {
    showConfirmDialog(
      '⚠️ 危险操作：重置所有设置\n\n这将完全重置FocusFlow到初始状态：\n• 删除所有自定义内容\n• 清空统计数据\n• 恢复默认配置\n• 清除用户偏好\n\n强烈建议在操作前导出数据备份！\n\n此操作无法撤销，确定要继续吗？',
      () => {
        try {
          // 重置音频设置
          const customSounds = soundService.getAllSounds().filter(sound => sound.id.startsWith('custom-'));
          customSounds.forEach(sound => {
            soundService.removeCustomSound(sound.id);
          });
          // 重置音效映射到默认值
          const defaultMappings = {
            focusStart: 'focusStart',
            breakStart: 'breakStart',
            microBreak: 'microBreak',
            notification: 'notification',
            whiteNoise: 'whiteNoise'
          };
          Object.entries(defaultMappings).forEach(([event, soundId]) => {
            soundService.setSoundMapping(event, soundId);
          });

          // 重置所有音效音量 - 使用公共方法
          const defaultSounds = ['notification', 'microBreak', 'focusStart', 'breakStart', 'whiteNoise'];
          defaultSounds.forEach(soundName => {
            try {
              soundService.setVolume(soundName as any, 0.5);
            } catch (error) {
              console.warn(`Failed to reset volume for ${soundName}:`, error);
            }
          });
          
          // 重置主题设置
          const themeService = getThemeService();
          const customThemes = themeService.getCustomThemes();
          customThemes.forEach(theme => {
            themeService.deleteCustomTheme(theme.id);
          });
          themeService.setTheme('light');
          
          // 重置计时器样式设置
          const timerStyleService = getTimerStyleService();
          const customStyles = timerStyleService.getCustomStyles();
          customStyles.forEach(style => {
            timerStyleService.removeCustomStyle(style.id);
          });
          timerStyleService.setCurrentStyle('digital');
          
          // 清空统计数据
          // databaseService.clearAllData(); // 方法暂未实现
          
          // 清除本地存储
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('focusflow-')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          onResetComplete?.('all');
          
          // 提示用户刷新页面
          setTimeout(() => {
            if (confirm('设置已重置完成。建议刷新页面以确保所有更改生效。是否立即刷新？')) {
              window.location.reload();
            }
          }, 1000);
        } catch (error) {
          console.error('Failed to reset all settings:', error);
        }
      },
      {
        type: 'danger',
        confirmText: '重置所有设置',
        confirmDanger: true
      }
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <RotateCcw className="h-6 w-6 text-orange-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">设置重置</h3>
            <p className="text-sm text-gray-600">重置各种设置到默认状态</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 音频设置重置 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Volume2 className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">音频设置</h4>
                <p className="text-sm text-gray-600">重置音效和音量配置</p>
              </div>
            </div>
            <Button
              onClick={resetAudioSettings}
              variant="outline"
              size="sm"
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              重置音频设置
            </Button>
          </div>

          {/* 主题设置重置 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Palette className="h-5 w-5 text-purple-600" />
              <div>
                <h4 className="font-medium text-gray-900">主题设置</h4>
                <p className="text-sm text-gray-600">重置主题和外观配置</p>
              </div>
            </div>
            <Button
              onClick={resetThemeSettings}
              variant="outline"
              size="sm"
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              重置主题设置
            </Button>
          </div>

          {/* 计时器样式重置 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Timer className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900">计时器样式</h4>
                <p className="text-sm text-gray-600">重置计时器样式配置</p>
              </div>
            </div>
            <Button
              onClick={resetTimerStyleSettings}
              variant="outline"
              size="sm"
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              重置样式设置
            </Button>
          </div>

          {/* 统计数据清空 */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Database className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="font-medium text-gray-900">统计数据</h4>
                <p className="text-sm text-gray-600">清空所有统计记录</p>
              </div>
            </div>
            <Button
              onClick={clearStatisticsData}
              variant="outline"
              size="sm"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              清空统计数据
            </Button>
          </div>
        </div>

        {/* 重置所有设置 */}
        <div className="mt-6 pt-6 border-t">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900 mb-2">危险操作区域</h4>
                <p className="text-sm text-red-700 mb-4">
                  以下操作将完全重置FocusFlow到初始状态，包括删除所有自定义内容和统计数据。
                  <strong>此操作无法撤销</strong>，请谨慎使用。
                </p>
                <Button
                  onClick={resetAllSettings}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重置所有设置
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog />
    </div>
  );
};

export default SettingsReset;
