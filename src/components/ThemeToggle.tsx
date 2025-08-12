import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from './ui/Button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/DropdownMenu';
import { useTheme, Theme } from '../hooks/useTheme';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  size = 'default',
  className = '',
}) => {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();

  const getThemeIcon = (themeType: Theme | 'actual') => {
    if (themeType === 'actual') {
      return actualTheme === 'dark' ? 
        <Moon className="h-4 w-4" /> : 
        <Sun className="h-4 w-4" />;
    }
    
    switch (themeType) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (themeType: Theme) => {
    switch (themeType) {
      case 'light':
        return '浅色模式';
      case 'dark':
        return '深色模式';
      case 'system':
        return '跟随系统';
      default:
        return '浅色模式';
    }
  };

  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={toggleTheme}
        className={`${className}`}
        title={`当前: ${getThemeLabel(theme)} (点击切换)`}
      >
        {getThemeIcon('actual')}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={`${className}`}
          title="选择主题"
        >
          {getThemeIcon('actual')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={`flex items-center space-x-2 ${theme === 'light' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
        >
          <Sun className="h-4 w-4" />
          <span>浅色模式</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={`flex items-center space-x-2 ${theme === 'dark' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
        >
          <Moon className="h-4 w-4" />
          <span>深色模式</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={`flex items-center space-x-2 ${theme === 'system' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
        >
          <Monitor className="h-4 w-4" />
          <span>跟随系统</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
