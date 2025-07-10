import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
}

export const useKeyboardShortcuts = ({ 
  enabled = true, 
  shortcuts 
}: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // 忽略在输入框中的按键
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    // 查找匹配的快捷键
    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase() ||
                      shortcut.key.toLowerCase() === event.code.toLowerCase();
      
      const ctrlMatch = (shortcut.ctrlKey ?? false) === event.ctrlKey;
      const altMatch = (shortcut.altKey ?? false) === event.altKey;
      const shiftMatch = (shortcut.shiftKey ?? false) === event.shiftKey;
      const metaMatch = (shortcut.metaKey ?? false) === event.metaKey;

      return keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch;
    });

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      matchingShortcut.action();
    }
  }, [enabled, shortcuts]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  return {
    shortcuts: shortcuts.map(shortcut => ({
      ...shortcut,
      displayKey: formatShortcutDisplay(shortcut)
    }))
  };
};

// 格式化快捷键显示
const formatShortcutDisplay = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.metaKey) parts.push('Cmd');
  
  // 格式化按键名称
  let keyName = shortcut.key;
  switch (shortcut.key.toLowerCase()) {
    case ' ':
    case 'space':
      keyName = 'Space';
      break;
    case 'escape':
      keyName = 'Esc';
      break;
    case 'enter':
      keyName = 'Enter';
      break;
    case 'arrowup':
      keyName = '↑';
      break;
    case 'arrowdown':
      keyName = '↓';
      break;
    case 'arrowleft':
      keyName = '←';
      break;
    case 'arrowright':
      keyName = '→';
      break;
    default:
      keyName = shortcut.key.toUpperCase();
  }
  
  parts.push(keyName);
  
  return parts.join(' + ');
};

// 预定义的常用快捷键
export const commonShortcuts = {
  SPACE: { key: 'Space', description: '开始/暂停计时器' },
  ESCAPE: { key: 'Escape', description: '关闭对话框' },
  ENTER: { key: 'Enter', description: '确认操作' },
  R: { key: 'r', description: '重置计时器' },
  S: { key: 's', ctrlKey: true, description: '保存设置' },
  QUESTION: { key: '?', shiftKey: true, description: '显示帮助' },
  H: { key: 'h', description: '显示/隐藏帮助' },
  T: { key: 't', description: '切换到计时器' },
  STATS: { key: 's', description: '切换到统计' },
  D: { key: 'd', description: '切换到数据库' },
  F11: { key: 'F11', description: '全屏模式' },
} as const;
