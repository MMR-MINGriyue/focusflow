import React, { createContext, useContext, useEffect, useState } from 'react';
import { getThemeService } from '../services/themeService';
import { Theme } from '../services/themeService';

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setCurrentTheme] = useState<Theme>(() => {
    const themeService = getThemeService();
    return themeService.getCurrentTheme();
  });
  const [availableThemes, setAvailableThemes] = useState<Theme[]>(() => {
    const themeService = getThemeService();
    return themeService.getAvailableThemes();
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const themeService = getThemeService();
    
    const handleThemeChange = (newTheme: Theme) => {
      setCurrentTheme(newTheme);
    };

    const unsubscribe = themeService.addThemeChangeListener(handleThemeChange);
    
    // 更新可用主题列表
    const updateThemes = () => {
      setAvailableThemes(themeService.getAvailableThemes());
    };

    // 监听自定义主题变化
    themeService.loadCustomThemes?.();
    updateThemes();

    return () => {
      unsubscribe();
    };
  }, []);

  const setTheme = async (themeId: string) => {
    setIsLoading(true);
    try {
      const themeService = getThemeService();
      themeService.setTheme(themeId);
    } catch (error) {
      console.error('Failed to set theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    availableThemes,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};