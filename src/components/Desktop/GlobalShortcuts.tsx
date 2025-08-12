/**
 * 全局快捷键系统
 * 提供系统级全局快捷键注册和管理
 */

import React, { useEffect, useCallback, useState, createContext, useContext } from 'react';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';
import { useSettingsStore } from '../../stores/settingsStore';

// Tauri API imports (在实际项目中使用)
// import { invoke } from '@tauri-apps/api/tauri';
// import { register, unregister, isRegistered } from '@tauri-apps/api/globalShortcut';

// 全局快捷键定义
export interface GlobalShortcut {
  id: string;
  name: string;
  description: string;
  defaultKeys: string;
  currentKeys: string;
  enabled: boolean;
  category: 'timer' | 'window' | 'system' | 'custom';
  handler: () => void | Promise<void>;
  conflictsWith?: string[]; // 可能冲突的快捷键
}

// 快捷键冲突信息
interface ShortcutConflict {
  shortcut: string;
  conflictingApps: string[];
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

// 全局快捷键管理器
export class GlobalShortcutManager {
  private static instance: GlobalShortcutManager;
  private shortcuts: Map<string, GlobalShortcut> = new Map();
  private registeredKeys: Set<string> = new Set();
  private conflicts: Map<string, ShortcutConflict> = new Map();
  private updateCallbacks: Set<() => void> = new Set();

  private constructor() {}

  static getInstance(): GlobalShortcutManager {
    if (!GlobalShortcutManager.instance) {
      GlobalShortcutManager.instance = new GlobalShortcutManager();
    }
    return GlobalShortcutManager.instance;
  }

  // 订阅变化
  subscribe(callback: () => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  private notifyUpdate() {
    this.updateCallbacks.forEach(callback => callback());
  }

  // 注册快捷键
  async registerShortcut(shortcut: GlobalShortcut): Promise<boolean> {
    try {
      // 检查冲突
      const conflict = await this.checkConflict(shortcut.currentKeys);
      if (conflict && conflict.severity === 'high') {
        console.warn(`Shortcut conflict detected for ${shortcut.currentKeys}:`, conflict);
        return false;
      }

      // 注销旧的快捷键
      if (this.shortcuts.has(shortcut.id)) {
        await this.unregisterShortcut(shortcut.id);
      }

      // 在Tauri应用中注册全局快捷键
      // await register(shortcut.currentKeys, shortcut.handler);
      
      // 模拟注册（开发环境）
      console.log(`Registered global shortcut: ${shortcut.currentKeys} for ${shortcut.name}`);

      this.shortcuts.set(shortcut.id, shortcut);
      this.registeredKeys.add(shortcut.currentKeys);
      
      if (conflict) {
        this.conflicts.set(shortcut.currentKeys, conflict);
      }

      this.notifyUpdate();
      return true;
    } catch (error) {
      console.error(`Failed to register shortcut ${shortcut.id}:`, error);
      return false;
    }
  }

  // 注销快捷键
  async unregisterShortcut(shortcutId: string): Promise<boolean> {
    try {
      const shortcut = this.shortcuts.get(shortcutId);
      if (!shortcut) return false;

      // 在Tauri应用中注销全局快捷键
      // await unregister(shortcut.currentKeys);
      
      console.log(`Unregistered global shortcut: ${shortcut.currentKeys}`);

      this.shortcuts.delete(shortcutId);
      this.registeredKeys.delete(shortcut.currentKeys);
      this.conflicts.delete(shortcut.currentKeys);

      this.notifyUpdate();
      return true;
    } catch (error) {
      console.error(`Failed to unregister shortcut ${shortcutId}:`, error);
      return false;
    }
  }

  // 更新快捷键
  async updateShortcut(shortcutId: string, newKeys: string): Promise<boolean> {
    const shortcut = this.shortcuts.get(shortcutId);
    if (!shortcut) return false;

    const updatedShortcut = { ...shortcut, currentKeys: newKeys };
    return await this.registerShortcut(updatedShortcut);
  }

  // 启用/禁用快捷键
  async toggleShortcut(shortcutId: string, enabled: boolean): Promise<boolean> {
    const shortcut = this.shortcuts.get(shortcutId);
    if (!shortcut) return false;

    if (enabled && !shortcut.enabled) {
      return await this.registerShortcut({ ...shortcut, enabled: true });
    } else if (!enabled && shortcut.enabled) {
      await this.unregisterShortcut(shortcutId);
      this.shortcuts.set(shortcutId, { ...shortcut, enabled: false });
      this.notifyUpdate();
      return true;
    }

    return true;
  }

  // 检查快捷键冲突
  private async checkConflict(keys: string): Promise<ShortcutConflict | null> {
    try {
      // 在实际应用中，这里会检查系统中已注册的快捷键
      // const isAlreadyRegistered = await isRegistered(keys);
      
      // 模拟冲突检测
      const commonConflicts: Record<string, ShortcutConflict> = {
        'Ctrl+C': {
          shortcut: 'Ctrl+C',
          conflictingApps: ['System', 'Most Applications'],
          severity: 'high',
          suggestion: '使用 Ctrl+Shift+C 或其他组合'
        },
        'Ctrl+V': {
          shortcut: 'Ctrl+V',
          conflictingApps: ['System', 'Most Applications'],
          severity: 'high',
          suggestion: '使用 Ctrl+Shift+V 或其他组合'
        },
        'Alt+Tab': {
          shortcut: 'Alt+Tab',
          conflictingApps: ['Windows System'],
          severity: 'high',
          suggestion: '使用 Ctrl+Alt+T 或其他组合'
        },
        'Ctrl+Alt+Del': {
          shortcut: 'Ctrl+Alt+Del',
          conflictingApps: ['Windows System'],
          severity: 'high',
          suggestion: '系统保留快捷键，无法使用'
        }
      };

      return commonConflicts[keys] || null;
    } catch (error) {
      console.error('Failed to check shortcut conflict:', error);
      return null;
    }
  }

  // 获取所有快捷键
  getAllShortcuts(): GlobalShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  // 获取冲突信息
  getConflicts(): Map<string, ShortcutConflict> {
    return new Map(this.conflicts);
  }

  // 重置所有快捷键为默认值
  async resetToDefaults(): Promise<void> {
    const shortcuts = Array.from(this.shortcuts.values());
    
    for (const shortcut of shortcuts) {
      if (shortcut.currentKeys !== shortcut.defaultKeys) {
        await this.updateShortcut(shortcut.id, shortcut.defaultKeys);
      }
    }
  }

  // 清理所有快捷键
  async cleanup(): Promise<void> {
    const shortcutIds = Array.from(this.shortcuts.keys());
    
    for (const id of shortcutIds) {
      await this.unregisterShortcut(id);
    }
  }
}

// 全局快捷键上下文
interface GlobalShortcutContext {
  shortcuts: GlobalShortcut[];
  conflicts: Map<string, ShortcutConflict>;
  registerShortcut: (shortcut: GlobalShortcut) => Promise<boolean>;
  unregisterShortcut: (id: string) => Promise<boolean>;
  updateShortcut: (id: string, keys: string) => Promise<boolean>;
  toggleShortcut: (id: string, enabled: boolean) => Promise<boolean>;
  resetToDefaults: () => Promise<void>;
}

const GlobalShortcutContext = createContext<GlobalShortcutContext | null>(null);

// 全局快捷键Provider
export const GlobalShortcutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shortcuts, setShortcuts] = useState<GlobalShortcut[]>([]);
  const [conflicts, setConflicts] = useState<Map<string, ShortcutConflict>>(new Map());
  
  const manager = GlobalShortcutManager.getInstance();
  const timerStore = useUnifiedTimerStore();
  const settingsStore = useSettingsStore();

  // 订阅管理器更新
  useEffect(() => {
    const updateState = () => {
      setShortcuts(manager.getAllShortcuts());
      setConflicts(manager.getConflicts());
    };

    updateState();
    const unsubscribe = manager.subscribe(updateState);
    return unsubscribe;
  }, [manager]);

  // 初始化默认快捷键
  useEffect(() => {
    const defaultShortcuts: GlobalShortcut[] = [
      {
        id: 'timer-start-pause',
        name: '开始/暂停计时器',
        description: '开始或暂停当前计时器',
        defaultKeys: 'Ctrl+Shift+Space',
        currentKeys: settingsStore.settings.shortcuts?.startPause || 'Ctrl+Shift+Space',
        enabled: true,
        category: 'timer',
        handler: () => {
          if (timerStore.isRunning) {
            timerStore.pause?.();
          } else {
            timerStore.start?.();
          }
        }
      },
      {
        id: 'timer-reset',
        name: '重置计时器',
        description: '重置当前计时器到初始状态',
        defaultKeys: 'Ctrl+Shift+R',
        currentKeys: settingsStore.settings.shortcuts?.reset || 'Ctrl+Shift+R',
        enabled: true,
        category: 'timer',
        handler: () => {
          timerStore.reset?.();
        }
      },
      {
        id: 'timer-skip',
        name: '跳过当前阶段',
        description: '跳过当前专注或休息阶段',
        defaultKeys: 'Ctrl+Shift+S',
        currentKeys: settingsStore.settings.shortcuts?.skip || 'Ctrl+Shift+S',
        enabled: true,
        category: 'timer',
        handler: () => {
          timerStore.skip?.();
        }
      },
      {
        id: 'show-hide-window',
        name: '显示/隐藏窗口',
        description: '切换主窗口的显示状态',
        defaultKeys: 'Ctrl+Shift+F',
        currentKeys: 'Ctrl+Shift+F',
        enabled: true,
        category: 'window',
        handler: async () => {
          try {
            // 在Tauri应用中实现
            // const isVisible = await appWindow.isVisible();
            // if (isVisible) {
            //   await appWindow.hide();
            // } else {
            //   await appWindow.show();
            //   await appWindow.setFocus();
            // }
            console.log('Toggle window visibility');
          } catch (error) {
            console.error('Failed to toggle window:', error);
          }
        }
      },
      {
        id: 'quick-focus-25',
        name: '快速开始25分钟专注',
        description: '立即开始25分钟专注会话',
        defaultKeys: 'Ctrl+Shift+1',
        currentKeys: 'Ctrl+Shift+1',
        enabled: false, // 默认禁用
        category: 'timer',
        handler: () => {
          settingsStore.updateTimerSettings({ focusDuration: 1500 });
          timerStore.start?.();
        }
      },
      {
        id: 'quick-focus-45',
        name: '快速开始45分钟专注',
        description: '立即开始45分钟专注会话',
        defaultKeys: 'Ctrl+Shift+2',
        currentKeys: 'Ctrl+Shift+2',
        enabled: false, // 默认禁用
        category: 'timer',
        handler: () => {
          settingsStore.updateTimerSettings({ focusDuration: 2700 });
          timerStore.start?.();
        }
      },
      {
        id: 'emergency-break',
        name: '紧急休息',
        description: '立即开始5分钟紧急休息',
        defaultKeys: 'Ctrl+Shift+B',
        currentKeys: 'Ctrl+Shift+B',
        enabled: false, // 默认禁用
        category: 'timer',
        handler: () => {
          timerStore.pause?.();
          // 开始紧急休息模式
          console.log('Emergency break activated');
        }
      }
    ];

    // 注册所有启用的快捷键
    defaultShortcuts.forEach(shortcut => {
      if (shortcut.enabled) {
        manager.registerShortcut(shortcut);
      } else {
        // 添加到管理器但不注册
        manager.shortcuts.set(shortcut.id, shortcut);
      }
    });

    // 清理函数
    return () => {
      manager.cleanup();
    };
  }, [manager, timerStore, settingsStore]);

  const contextValue: GlobalShortcutContext = {
    shortcuts,
    conflicts,
    registerShortcut: manager.registerShortcut.bind(manager),
    unregisterShortcut: manager.unregisterShortcut.bind(manager),
    updateShortcut: manager.updateShortcut.bind(manager),
    toggleShortcut: manager.toggleShortcut.bind(manager),
    resetToDefaults: manager.resetToDefaults.bind(manager)
  };

  return (
    <GlobalShortcutContext.Provider value={contextValue}>
      {children}
    </GlobalShortcutContext.Provider>
  );
};

// 使用全局快捷键Hook
export const useGlobalShortcuts = () => {
  const context = useContext(GlobalShortcutContext);
  if (!context) {
    throw new Error('useGlobalShortcuts must be used within GlobalShortcutProvider');
  }
  return context;
};

// 快捷键设置面板组件
export const GlobalShortcutSettings: React.FC<{ className?: string }> = ({ className }) => {
  const { shortcuts, conflicts, updateShortcut, toggleShortcut, resetToDefaults } = useGlobalShortcuts();
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [newKeys, setNewKeys] = useState('');

  // 按分类分组快捷键
  const shortcutsByCategory = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, GlobalShortcut[]>);

  const categoryNames = {
    timer: '计时器',
    window: '窗口',
    system: '系统',
    custom: '自定义'
  };

  const handleSaveShortcut = async (shortcutId: string) => {
    if (newKeys.trim()) {
      const success = await updateShortcut(shortcutId, newKeys.trim());
      if (success) {
        setEditingShortcut(null);
        setNewKeys('');
      } else {
        alert('快捷键注册失败，可能存在冲突');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingShortcut(null);
    setNewKeys('');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">全局快捷键设置</h3>
        <button
          onClick={resetToDefaults}
          className="px-3 py-1 text-sm border rounded hover:bg-muted"
        >
          重置为默认
        </button>
      </div>

      {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
        <div key={category} className="space-y-3">
          <h4 className="font-medium text-muted-foreground">
            {categoryNames[category as keyof typeof categoryNames]}
          </h4>
          
          <div className="space-y-2">
            {categoryShortcuts.map(shortcut => {
              const conflict = conflicts.get(shortcut.currentKeys);
              const isEditing = editingShortcut === shortcut.id;
              
              return (
                <div
                  key={shortcut.id}
                  className={`p-3 border rounded-lg ${conflict ? 'border-yellow-300 bg-yellow-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{shortcut.name}</div>
                      <div className="text-sm text-muted-foreground">{shortcut.description}</div>
                      {conflict && (
                        <div className="text-xs text-yellow-700 mt-1">
                          ⚠️ 可能与 {conflict.conflictingApps.join(', ')} 冲突
                          {conflict.suggestion && ` - ${conflict.suggestion}`}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newKeys}
                            onChange={(e) => setNewKeys(e.target.value)}
                            placeholder="输入新快捷键"
                            className="px-2 py-1 text-sm border rounded w-32"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveShortcut(shortcut.id);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                          />
                          <button
                            onClick={() => handleSaveShortcut(shortcut.id)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded"
                          >
                            保存
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 text-xs border rounded"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <>
                          <kbd className="px-2 py-1 text-xs font-mono bg-muted border rounded">
                            {shortcut.currentKeys}
                          </kbd>
                          <button
                            onClick={() => {
                              setEditingShortcut(shortcut.id);
                              setNewKeys(shortcut.currentKeys);
                            }}
                            className="px-2 py-1 text-xs border rounded hover:bg-muted"
                          >
                            编辑
                          </button>
                        </>
                      )}
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={shortcut.enabled}
                          onChange={(e) => toggleShortcut(shortcut.id, e.target.checked)}
                          className="mr-1"
                        />
                        <span className="text-xs">启用</span>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {conflicts.size > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="font-medium text-yellow-800 mb-2">快捷键冲突警告</div>
          <div className="text-sm text-yellow-700">
            检测到 {conflicts.size} 个可能的快捷键冲突。建议修改冲突的快捷键以避免意外行为。
          </div>
        </div>
      )}
    </div>
  );
};

export default {
  GlobalShortcutManager,
  GlobalShortcutProvider,
  GlobalShortcutSettings,
  useGlobalShortcuts
};