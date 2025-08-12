import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Keyboard, RotateCcw, Save, Plus, Trash2 } from 'lucide-react';

interface ShortcutSettingsProps {
  className?: string;
}

interface Shortcut {
  id: string;
  name: string;
  description: string;
  keys: string;
  editable: boolean;
  enabled: boolean;
}

const ShortcutSettings: React.FC<ShortcutSettingsProps> = ({ className = '' }) => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([
    {
      id: 'start-pause',
      name: '开始/暂停',
      description: '开始或暂停当前计时器',
      keys: 'Space',
      editable: false,
      enabled: true
    },
    {
      id: 'reset',
      name: '重置计时器',
      description: '重置当前计时器到初始状态',
      keys: 'R',
      editable: false,
      enabled: true
    },
    {
      id: 'skip',
      name: '跳过当前阶段',
      description: '跳过当前的专注或休息阶段',
      keys: 'S',
      editable: false,
      enabled: true
    },
    {
      id: 'show-stats',
      name: '显示统计',
      description: '切换到统计页面',
      keys: 'D',
      editable: true,
      enabled: true
    },
    {
      id: 'show-settings',
      name: '显示设置',
      description: '打开设置页面',
      keys: 'Ctrl+,',
      editable: true,
      enabled: true
    },
    {
      id: 'show-help',
      name: '显示帮助',
      description: '显示快捷键帮助',
      keys: '?',
      editable: false,
      enabled: true
    }
  ]);

  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [newShortcutKeys, setNewShortcutKeys] = useState('');

  const handleSaveSettings = () => {
    // 保存设置的逻辑
    console.log(shortcuts);
    alert('快捷键设置已保存');
  };

  const handleResetSettings = () => {
    // 重置设置的逻辑
    alert('快捷键设置已重置');
  };

  const handleToggleShortcut = (id: string) => {
    setShortcuts(prev => 
      prev.map(shortcut => 
        shortcut.id === id 
          ? { ...shortcut, enabled: !shortcut.enabled } 
          : shortcut
      )
    );
  };

  const startEditingShortcut = (id: string, currentKeys: string) => {
    setEditingShortcut(id);
    setNewShortcutKeys(currentKeys);
  };

  const saveShortcutKeys = (id: string) => {
    setShortcuts(prev => 
      prev.map(shortcut => 
        shortcut.id === id 
          ? { ...shortcut, keys: newShortcutKeys } 
          : shortcut
      )
    );
    setEditingShortcut(null);
    setNewShortcutKeys('');
  };

  const cancelEditingShortcut = () => {
    setEditingShortcut(null);
    setNewShortcutKeys('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingShortcut) return;

    e.preventDefault();

    let keys = [];

    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Cmd');

    if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
      keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
    }

    setNewShortcutKeys(keys.join('+'));
  };

  return (
    <div className={className}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Keyboard className="w-5 h-5 mr-2" />
            快捷键设置
          </CardTitle>
          <CardDescription>
            自定义应用快捷键以提高工作效率
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium">{shortcut.name}</h4>
                    {!shortcut.editable && (
                      <span className="ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">
                        系统快捷键
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {shortcut.description}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {editingShortcut === shortcut.id ? (
                    <div className="flex items-center space-x-2">
                      <div 
                        className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded min-w-[120px] text-center"
                        tabIndex={0}
                        onKeyDown={handleKeyDown}
                      >
                        {newShortcutKeys || '按下快捷键'}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => saveShortcutKeys(shortcut.id)}
                        disabled={!newShortcutKeys}
                      >
                        保存
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={cancelEditingShortcut}
                      >
                        取消
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <div className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded font-mono">
                          {shortcut.keys}
                        </div>

                        {shortcut.editable && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => startEditingShortcut(shortcut.id, shortcut.keys)}
                          >
                            编辑
                          </Button>
                        )}

                        <Switch
                          checked={shortcut.enabled}
                          onCheckedChange={() => handleToggleShortcut(shortcut.id)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            添加自定义快捷键
          </CardTitle>
          <CardDescription>
            创建您自己的快捷键组合
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              自定义快捷键功能正在开发中
            </p>
            <Button variant="outline" disabled>
              <Plus className="w-4 h-4 mr-2" />
              添加快捷键
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button 
          onClick={handleResetSettings}
          variant="outline"
          className="flex items-center"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          重置默认
        </Button>

        <Button 
          onClick={handleSaveSettings}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          保存设置
        </Button>
      </div>
    </div>
  );
};

export default ShortcutSettings;