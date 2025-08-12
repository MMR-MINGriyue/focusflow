/**
 * 通知设置组件
 * 
 * 提供通知权限管理、模板配置和通知测试功能
 */

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Volume2, VolumeX, TestTube, Settings, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { getNotificationService, NotificationTemplate } from '../../services/notification';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface NotificationSettingsProps {
  /** 是否启用通知 */
  notificationEnabled: boolean;
  /** 通知启用状态变化回调 */
  onNotificationEnabledChange: (enabled: boolean) => void;
  /** 是否启用声音 */
  soundEnabled: boolean;
  /** 声音启用状态变化回调 */
  onSoundEnabledChange: (enabled: boolean) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  notificationEnabled,
  onNotificationEnabledChange,
  soundEnabled,
  onSoundEnabledChange
}) => {
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default' | null>(null);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  // 模板编辑功能 - 预留用于未来功能
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate] = useState<NotificationTemplate | null>(null);

  // 避免未使用变量警告
  void editingTemplate;
  void showTemplateEditor;
  
  const { handleError, showSuccess, showWarning } = useErrorHandler({
    context: { component: 'NotificationSettings' }
  });

  useEffect(() => {
    loadNotificationData();
  }, []);

  /**
   * 加载通知数据
   */
  const loadNotificationData = async () => {
    try {
      const service = getNotificationService();
    const status = service.getPermissionStatus();
    setPermissionStatus(status);
    
    const allTemplates = service.getAllTemplates();
    setTemplates(allTemplates);
    } catch (error) {
      handleError(error as Error, { userMessage: '加载通知设置失败' });
    }
  };

  /**
   * 请求通知权限
   */
  const requestNotificationPermission = async () => {
    try {
      const service = getNotificationService();
      const granted = await service.checkPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      
      if (granted) {
        showSuccess('通知权限已获取');
        onNotificationEnabledChange(true);
      } else {
        showWarning('通知权限被拒绝，请在系统设置中手动开启');
      }
    } catch (error) {
      handleError(error as Error, { userMessage: '请求通知权限失败' });
    }
  };

  /**
   * 测试通知
   */
  const testNotification = async () => {
    if (isTestingNotification) return;
    
    setIsTestingNotification(true);
    try {
      const success = await getNotificationService().sendNotification(
        '🧪 FocusFlow 测试通知',
        '如果您看到这条通知，说明通知功能正常工作！',
        {
          icon: 'test-icon.png',
          sound: soundEnabled ? 'test-sound.wav' : undefined
        }
      );

      if (success) {
        showSuccess('测试通知已发送');
      } else {
        showWarning('发送测试通知失败，请检查权限设置');
      }
    } catch (error) {
      handleError(error as Error, { userMessage: '发送测试通知失败' });
    } finally {
      setIsTestingNotification(false);
    }
  };

  /**
   * 测试模板通知
   */
  const testTemplateNotification = async (templateId: string) => {
    try {
      const success = await getNotificationService().sendTemplateNotification(templateId, {
        duration: '25',
        time: new Date().toLocaleTimeString()
      });

      if (success) {
        showSuccess('模板通知已发送');
      } else {
        showWarning('发送模板通知失败');
      }
    } catch (error) {
      handleError(error as Error, { userMessage: '发送模板通知失败' });
    }
  };

  /**
   * 删除自定义模板
   */
  const deleteTemplate = (templateId: string) => {
    try {
      const success = getNotificationService().removeTemplate(templateId);
      if (success) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        showSuccess('模板已删除');
      } else {
        showWarning('删除模板失败');
      }
    } catch (error) {
      handleError(error as Error, { userMessage: '删除模板失败' });
    }
  };

  /**
   * 获取权限状态显示
   */
  const getPermissionStatusDisplay = () => {
    switch (permissionStatus) {
      case 'granted':
        return { text: '已授权', color: 'text-green-600', icon: Bell };
      case 'denied':
        return { text: '已拒绝', color: 'text-red-600', icon: BellOff };
      case 'default':
        return { text: '未设置', color: 'text-yellow-600', icon: Bell };
      default:
        return { text: '检查中...', color: 'text-gray-600', icon: Bell };
    }
  };

  const permissionDisplay = getPermissionStatusDisplay();
  const PermissionIcon = permissionDisplay.icon;

  return (
    <div className="space-y-6">
      {/* 通知权限状态 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          通知权限
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <PermissionIcon className={`h-5 w-5 ${permissionDisplay.color}`} />
            <div>
              <p className="font-medium">权限状态</p>
              <p className={`text-sm ${permissionDisplay.color}`}>
                {permissionDisplay.text}
              </p>
            </div>
          </div>
          
          {permissionStatus !== 'granted' && (
            <Button
              onClick={requestNotificationPermission}
              variant="outline"
              size="sm"
            >
              请求权限
            </Button>
          )}
        </div>
      </div>

      {/* 通知设置 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          通知设置
        </h3>
        
        <div className="space-y-4">
          {/* 启用通知 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {notificationEnabled ? (
                <Bell className="h-5 w-5 text-blue-600" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">桌面通知</p>
                <p className="text-sm text-gray-600">
                  在计时器状态变化时显示桌面通知
                </p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationEnabled}
                onChange={(e) => onNotificationEnabledChange(e.target.checked)}
                disabled={permissionStatus !== 'granted'}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 启用声音 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {soundEnabled ? (
                <Volume2 className="h-5 w-5 text-blue-600" />
              ) : (
                <VolumeX className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">通知声音</p>
                <p className="text-sm text-gray-600">
                  通知时播放提示音
                </p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => onSoundEnabledChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 测试通知 */}
          <div className="pt-4 border-t">
            <Button
              onClick={testNotification}
              disabled={!notificationEnabled || permissionStatus !== 'granted' || isTestingNotification}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTestingNotification ? '发送中...' : '测试通知'}
            </Button>
          </div>
        </div>
      </div>

      {/* 通知模板 */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            通知模板
          </h3>
          
          <Button
            onClick={() => setShowTemplateEditor(true)}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加模板
          </Button>
        </div>
        
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{template.name}</p>
                <p className="text-sm text-gray-600">{template.title}</p>
                <p className="text-xs text-gray-500">{template.body}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => testTemplateNotification(template.id)}
                  disabled={!notificationEnabled || permissionStatus !== 'granted'}
                  variant="ghost"
                  size="sm"
                >
                  <TestTube className="h-4 w-4" />
                </Button>
                
                {!template.id.startsWith('focus-') && !template.id.startsWith('break-') && !template.id.startsWith('micro-') && (
                  <Button
                    onClick={() => deleteTemplate(template.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
