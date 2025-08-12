/**
 * 键盘导航系统
 * 提供全局键盘快捷键管理和焦点管理功能
 */

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useRef, 
  useState, 
  useCallback,
  ReactNode
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Keyboard,
  Command,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Enter,
  Escape,
  Tab,
  Space,
  Help,
  Settings,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/Dialog';
import { cn } from '../../utils/cn';

// 快捷键定义
export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  keys: string[];
  category: string;
  handler: (event: KeyboardEvent) => void;
  enabled: boolean;
  global?: boolean; // 是否为全局快捷键
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

// 焦点管理选项
interface FocusOptions {
  preventScroll?: boolean;
  selectText?: boolean;
  restoreFocus?: boolean;
}

// 键盘导航上下文
interface KeyboardNavigationContext {
  shortcuts: Map<string, KeyboardShortcut>;
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  enableShortcut: (id: string) => void;
  disableShortcut: (id: string) => void;
  focusNext: () => void;
  focusPrevious: () => void;
  focusFirst: () => void;
  focusLast: () => void;
  trapFocus: (container: HTMLElement) => () => void;
  restoreFocus: () => void;
  showHelp: () => void;
  hideHelp: () => void;
}

const KeyboardContext = createContext<KeyboardNavigationContext | null>(null);

// 键盘导航Provider
export const KeyboardNavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shortcuts] = useState(new Map<string, KeyboardShortcut>());
  const [showHelp, setShowHelp] = useState(false);
  const [focusHistory, setFocusHistory] = useState<HTMLElement[]>([]);
  const currentFocusRef = useRef<HTMLElement | null>(null);
  const trapContainerRef = useRef<HTMLElement | null>(null);

  // 注册快捷键
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    shortcuts.set(shortcut.id, shortcut);
  }, [shortcuts]);

  // 注销快捷键
  const unregisterShortcut = useCallback((id: string) => {
    shortcuts.delete(id);
  }, [shortcuts]);

  // 启用快捷键
  const enableShortcut = useCallback((id: string) => {
    const shortcut = shortcuts.get(id);
    if (shortcut) {
      shortcut.enabled = true;
    }
  }, [shortcuts]);

  // 禁用快捷键
  const disableShortcut = useCallback((id: string) => {
    const shortcut = shortcuts.get(id);
    if (shortcut) {
      shortcut.enabled = false;
    }
  }, [shortcuts]);

  // 获取可聚焦元素
  const getFocusableElements = useCallback((container: HTMLElement = document.body): HTMLElement[] => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(el => {
        const element = el as HTMLElement;
        return element.offsetParent !== null && // 元素可见
               !element.hasAttribute('aria-hidden') &&
               element.getAttribute('aria-disabled') !== 'true';
      }) as HTMLElement[];
  }, []);

  // 聚焦下一个元素
  const focusNext = useCallback(() => {
    const focusableElements = getFocusableElements(trapContainerRef.current || document.body);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    focusableElements[nextIndex]?.focus();
  }, [getFocusableElements]);

  // 聚焦上一个元素
  const focusPrevious = useCallback(() => {
    const focusableElements = getFocusableElements(trapContainerRef.current || document.body);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    focusableElements[prevIndex]?.focus();
  }, [getFocusableElements]);

  // 聚焦第一个元素
  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements(trapContainerRef.current || document.body);
    focusableElements[0]?.focus();
  }, [getFocusableElements]);

  // 聚焦最后一个元素
  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements(trapContainerRef.current || document.body);
    focusableElements[focusableElements.length - 1]?.focus();
  }, [getFocusableElements]);

  // 焦点陷阱
  const trapFocus = useCallback((container: HTMLElement) => {
    trapContainerRef.current = container;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      
      const focusableElements = getFocusableElements(container);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // 返回清理函数
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      trapContainerRef.current = null;
    };
  }, [getFocusableElements]);

  // 恢复焦点
  const restoreFocus = useCallback(() => {
    if (focusHistory.length > 0) {
      const lastFocused = focusHistory[focusHistory.length - 1];
      if (lastFocused && document.contains(lastFocused)) {
        lastFocused.focus();
        setFocusHistory(prev => prev.slice(0, -1));
      }
    }
  }, [focusHistory]);

  // 键盘事件处理
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement;
    
    // 记录焦点历史
    if (activeElement && activeElement !== currentFocusRef.current) {
      if (currentFocusRef.current) {
        setFocusHistory(prev => [...prev.slice(-9), currentFocusRef.current!]);
      }
      currentFocusRef.current = activeElement;
    }

    // 检查快捷键
    for (const shortcut of shortcuts.values()) {
      if (!shortcut.enabled) continue;
      
      const keys = shortcut.keys.map(key => key.toLowerCase());
      const pressedKeys = [];
      
      if (event.ctrlKey || event.metaKey) pressedKeys.push('ctrl');
      if (event.altKey) pressedKeys.push('alt');
      if (event.shiftKey) pressedKeys.push('shift');
      pressedKeys.push(event.key.toLowerCase());
      
      const keysMatch = keys.length === pressedKeys.length && 
                       keys.every(key => pressedKeys.includes(key));
      
      if (keysMatch) {
        if (shortcut.preventDefault) event.preventDefault();
        if (shortcut.stopPropagation) event.stopPropagation();
        shortcut.handler(event);
        return;
      }
    }

    // 默认导航快捷键
    switch (event.key) {
      case 'F1':
        if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
          event.preventDefault();
          setShowHelp(true);
        }
        break;
    }
  }, [shortcuts]);

  // 注册全局事件监听器
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 注册默认快捷键
  useEffect(() => {
    const defaultShortcuts: KeyboardShortcut[] = [
      {
        id: 'help',
        name: '显示帮助',
        description: '显示键盘快捷键帮助',
        keys: ['F1'],
        category: '通用',
        handler: () => setShowHelp(true),
        enabled: true,
        global: true,
        preventDefault: true
      },
      {
        id: 'close-help',
        name: '关闭帮助',
        description: '关闭帮助对话框',
        keys: ['Escape'],
        category: '通用',
        handler: () => setShowHelp(false),
        enabled: true,
        preventDefault: true
      },
      {
        id: 'focus-next',
        name: '下一个焦点',
        description: '移动到下一个可聚焦元素',
        keys: ['Tab'],
        category: '导航',
        handler: (e) => {
          if (!e.shiftKey && !trapContainerRef.current) {
            e.preventDefault();
            focusNext();
          }
        },
        enabled: true
      },
      {
        id: 'focus-previous',
        name: '上一个焦点',
        description: '移动到上一个可聚焦元素',
        keys: ['Shift', 'Tab'],
        category: '导航',
        handler: (e) => {
          if (!trapContainerRef.current) {
            e.preventDefault();
            focusPrevious();
          }
        },
        enabled: true
      }
    ];

    defaultShortcuts.forEach(registerShortcut);
  }, [registerShortcut, focusNext, focusPrevious]);

  const contextValue: KeyboardNavigationContext = {
    shortcuts,
    registerShortcut,
    unregisterShortcut,
    enableShortcut,
    disableShortcut,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    trapFocus,
    restoreFocus,
    showHelp: () => setShowHelp(true),
    hideHelp: () => setShowHelp(false)
  };

  return (
    <KeyboardContext.Provider value={contextValue}>
      {children}
      <KeyboardHelpDialog open={showHelp} onOpenChange={setShowHelp} />
    </KeyboardContext.Provider>
  );
};

// 使用键盘导航Hook
export const useKeyboardNavigation = () => {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboardNavigation must be used within KeyboardNavigationProvider');
  }
  return context;
};

// 快捷键Hook
export const useKeyboardShortcut = (shortcut: Omit<KeyboardShortcut, 'enabled'>) => {
  const { registerShortcut, unregisterShortcut } = useKeyboardNavigation();

  useEffect(() => {
    const fullShortcut: KeyboardShortcut = { ...shortcut, enabled: true };
    registerShortcut(fullShortcut);
    
    return () => unregisterShortcut(shortcut.id);
  }, [shortcut, registerShortcut, unregisterShortcut]);
};

// 焦点陷阱Hook
export const useFocusTrap = (enabled: boolean = true) => {
  const { trapFocus } = useKeyboardNavigation();
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;
    
    const cleanup = trapFocus(containerRef.current);
    return cleanup;
  }, [enabled, trapFocus]);

  return containerRef;
};

// 键盘帮助对话框
const KeyboardHelpDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const { shortcuts } = useKeyboardNavigation();
  const containerRef = useFocusTrap(open);

  // 按分类分组快捷键
  const shortcutsByCategory = React.useMemo(() => {
    const categories: Record<string, KeyboardShortcut[]> = {};
    
    for (const shortcut of shortcuts.values()) {
      if (!categories[shortcut.category]) {
        categories[shortcut.category] = [];
      }
      categories[shortcut.category].push(shortcut);
    }
    
    return categories;
  }, [shortcuts]);

  // 格式化快捷键显示
  const formatKeys = useCallback((keys: string[]) => {
    return keys.map(key => {
      switch (key.toLowerCase()) {
        case 'ctrl':
        case 'cmd':
          return '⌘';
        case 'alt':
          return '⌥';
        case 'shift':
          return '⇧';
        case 'enter':
          return '↵';
        case 'escape':
          return '⎋';
        case 'tab':
          return '⇥';
        case 'space':
          return '␣';
        case 'arrowup':
          return '↑';
        case 'arrowdown':
          return '↓';
        case 'arrowleft':
          return '←';
        case 'arrowright':
          return '→';
        default:
          return key.toUpperCase();
      }
    }).join(' + ');
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={containerRef}
        size="2xl" 
        className="max-h-[80vh] overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            键盘快捷键
          </DialogTitle>
          <DialogDescription>
            使用这些快捷键可以更高效地操作应用
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-96">
          <div className="space-y-6">
            {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {category === '通用' && <Command className="h-4 w-4" />}
                  {category === '导航' && <ArrowRight className="h-4 w-4" />}
                  {category === '计时器' && <Clock className="h-4 w-4" />}
                  {category === '设置' && <Settings className="h-4 w-4" />}
                  {category}
                </h3>
                
                <div className="space-y-2">
                  {categoryShortcuts.map(shortcut => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{shortcut.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {shortcut.description}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, index) => (
                          <React.Fragment key={key}>
                            {index > 0 && <span className="text-muted-foreground">+</span>}
                            <kbd className="px-2 py-1 text-xs font-mono bg-background border rounded">
                              {formatKeys([key])}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            按 F1 随时查看此帮助
          </div>
          <Button onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 可访问的按钮组件
export const AccessibleButton: React.FC<{
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  shortcut?: string[];
}> = ({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'md',
  className,
  ariaLabel,
  ariaDescribedBy,
  shortcut
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 注册快捷键
  useKeyboardShortcut({
    id: `button-${ariaLabel || 'unnamed'}`,
    name: ariaLabel || '按钮',
    description: `激活${ariaLabel || '按钮'}`,
    keys: shortcut || [],
    category: '按钮',
    handler: () => {
      if (!disabled && onClick) {
        buttonRef.current?.focus();
        onClick();
      }
    }
  });

  return (
    <Button
      ref={buttonRef}
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled}
    >
      {children}
      {shortcut && shortcut.length > 0 && (
        <span className="ml-2 text-xs opacity-60">
          ({shortcut.join('+')})
        </span>
      )}
    </Button>
  );
};

// 跳转链接组件
export const SkipLink: React.FC<{
  href: string;
  children: ReactNode;
  className?: string;
}> = ({ href, children, className }) => {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'z-50 px-4 py-2 bg-primary text-primary-foreground rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
    >
      {children}
    </a>
  );
};

// 焦点指示器组件
export const FocusIndicator: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        'rounded-md transition-all',
        className
      )}
    >
      {children}
    </div>
  );
};

export default {
  KeyboardNavigationProvider,
  useKeyboardNavigation,
  useKeyboardShortcut,
  useFocusTrap,
  AccessibleButton,
  SkipLink,
  FocusIndicator
};