import React, { useEffect, useState } from 'react';
import { ThemeManager } from '../Settings/ThemeManager';
import { getThemeService, Theme } from '../../services/themeService';

interface ThemeIntegrationProps {
  children: React.ReactNode;
  onThemeChange?: (theme: Theme) => void;
}

export const ThemeIntegration: React.FC<ThemeIntegrationProps> = ({
  children,
  onThemeChange,
}) => {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // 初始化主题
    const initTheme = () => {
      const themeService = getThemeService();
      const activeTheme = themeService.getCurrentTheme();
      setCurrentTheme(activeTheme);
      onThemeChange?.(activeTheme);
    };

    initTheme();

    // 监听主题变化
    const handleThemeChange = (theme: Theme) => {
      setCurrentTheme(theme);
      onThemeChange?.(theme);
    };

    const themeService = getThemeService();
    const unsubscribe = themeService.addThemeChangeListener(handleThemeChange);

    return () => {
      unsubscribe();
    };
  }, [onThemeChange]);



  return (
    <>
      <div className="theme-integration">
        {children}
        


        {/* 主题管理器 */}
        <ThemeManager onThemeChange={onThemeChange} />
      </div>

      {/* 主题样式注入 */}
      <style>{`
        :root {
          ${currentTheme && 'cssVariables' in currentTheme && currentTheme.cssVariables
            ? Object.entries(currentTheme.cssVariables as Record<string, string>)
                .map(([key, value]) => `${key}: ${value};`)
                .join('\n')
            : ''}
        }

        * {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }

        body {
          background-color: var(--background);
          color: var(--foreground);
        }

        .theme-toggle-button {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
        }

        @media (max-width: 768px) {
          .theme-toggle-button {
            top: 10px;
            right: 10px;
            padding: 6px 10px;
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
};