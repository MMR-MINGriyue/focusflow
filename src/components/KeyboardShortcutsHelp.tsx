import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Keyboard, HelpCircle } from 'lucide-react';
import { KeyboardShortcut } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  shortcuts: (KeyboardShortcut & { displayKey: string })[];
  isOpen?: boolean;
  onClose?: () => void;
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  shortcuts,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const onClose = controlledOnClose || (() => setInternalIsOpen(false));
  const onOpen = () => setInternalIsOpen(true);

  // 按类别分组快捷键
  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    let category = '通用';
    
    if (shortcut.description.includes('计时器') || shortcut.description.includes('开始') || shortcut.description.includes('暂停') || shortcut.description.includes('重置')) {
      category = '计时器控制';
    } else if (shortcut.description.includes('切换') || shortcut.description.includes('导航')) {
      category = '导航';
    } else if (shortcut.description.includes('设置') || shortcut.description.includes('保存')) {
      category = '设置';
    } else if (shortcut.description.includes('帮助') || shortcut.description.includes('显示')) {
      category = '帮助';
    }
    
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    
    return groups;
  }, {} as Record<string, typeof shortcuts>);

  const ShortcutItem: React.FC<{ shortcut: KeyboardShortcut & { displayKey: string } }> = ({ shortcut }) => (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
      <span className="text-sm text-gray-700">{shortcut.description}</span>
      <Badge variant="outline" className="font-mono text-xs">
        {shortcut.displayKey}
      </Badge>
    </div>
  );

  return (
    <>
      {/* 触发按钮（如果不是受控组件） */}
      {controlledIsOpen === undefined && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpen}
          className="fixed bottom-4 left-4 p-2 bg-white shadow-lg border rounded-full hover:bg-gray-50 z-40"
          title="键盘快捷键 (按 ? 查看)"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Keyboard className="h-5 w-5" />
              <span>键盘快捷键</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {category}
                </h3>
                <div className="space-y-1">
                  {categoryShortcuts.map((shortcut, index) => (
                    <ShortcutItem key={index} shortcut={shortcut} />
                  ))}
                </div>
              </div>
            ))}

            {shortcuts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无可用的快捷键</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                <p>💡 提示：在输入框中时快捷键不会生效</p>
              </div>
              <Button variant="outline" onClick={onClose}>
                关闭
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default KeyboardShortcutsHelp;
