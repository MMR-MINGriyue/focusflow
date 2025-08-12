/**
 * 测试辅助工具
 * 提供常用的测试工具函数和组件包装器
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../theme/ThemeProvider';
import { KeyboardNavigationProvider } from '../components/Accessibility/KeyboardNavigation';
import { ScreenReaderProvider } from '../components/Accessibility/ScreenReaderSupport';
import { VisualAssistanceProvider } from '../components/Accessibility/VisualAssistance';
import { ResourceManagerProvider } from '../components/Performance/ResourceManager';
import { MemoryManagerProvider } from '../components/Performance/MemoryManager';

// 创建测试用的QueryClient
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// 全功能Provider包装器
interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  initialRoute?: string;
}

const AllProviders: React.FC<AllProvidersProps> = ({ 
  children, 
  queryClient = createTestQueryClient(),
  initialRoute = '/'
}) => {
  // 设置初始路由
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <VisualAssistanceProvider>
            <KeyboardNavigationProvider>
              <ScreenReaderProvider>
                <ResourceManagerProvider>
                  <MemoryManagerProvider>
                    {children}
                  </MemoryManagerProvider>
                </ResourceManagerProvider>
              </ScreenReaderProvider>
            </KeyboardNavigationProvider>
          </VisualAssistanceProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// 自定义render函数
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
  wrapper?: React.ComponentType<{ children: ReactNode }>;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { queryClient, initialRoute, wrapper, ...renderOptions } = options;

  const Wrapper = wrapper || (({ children }) => (
    <AllProviders queryClient={queryClient} initialRoute={initialRoute}>
      {children}
    </AllProviders>
  ));

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// 仅主题Provider
export const renderWithTheme = (ui: ReactElement, options: RenderOptions = {}) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider>{children}</ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// 仅路由Provider
export const renderWithRouter = (
  ui: ReactElement, 
  { initialRoute = '/', ...options }: CustomRenderOptions = {}
) => {
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// 无障碍Provider
export const renderWithAccessibility = (ui: ReactElement, options: RenderOptions = {}) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <VisualAssistanceProvider>
      <KeyboardNavigationProvider>
        <ScreenReaderProvider>
          {children}
        </ScreenReaderProvider>
      </KeyboardNavigationProvider>
    </VisualAssistanceProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// 性能监控Provider
export const renderWithPerformance = (ui: ReactElement, options: RenderOptions = {}) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ResourceManagerProvider>
      <MemoryManagerProvider>
        {children}
      </MemoryManagerProvider>
    </ResourceManagerProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// 测试数据生成器
export const createMockTimerState = (overrides = {}) => ({
  isRunning: false,
  isPaused: false,
  currentTime: 1500, // 25 minutes
  totalTime: 1500,
  currentPhase: 'focus' as const,
  sessionsCompleted: 0,
  settings: {
    focusDuration: 1500,
    shortBreakDuration: 300,
    longBreakDuration: 900,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
  },
  ...overrides,
});

export const createMockSettingsState = (overrides = {}) => ({
  timer: {
    focusDuration: 1500,
    shortBreakDuration: 300,
    longBreakDuration: 900,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
  },
  notifications: {
    enabled: true,
    desktop: true,
    sound: true,
    breakReminders: true,
    focusReminders: false,
    customMessages: false,
  },
  audio: {
    masterVolume: 80,
    effectsVolume: 70,
    tickingSound: false,
    completionSound: 'bell',
    backgroundMusic: false,
    musicVolume: 50,
  },
  ui: {
    compactMode: false,
    showSeconds: true,
    showProgress: true,
    animationsEnabled: true,
    showStats: true,
    sidebarCollapsed: false,
    defaultView: 'timer' as const,
  },
  privacy: {
    analytics: false,
    crashReports: false,
    dataCollection: false,
    shareUsageData: false,
  },
  ...overrides,
});

export const createMockStatsData = (overrides = {}) => ({
  totalFocusTime: 12600, // 3.5 hours
  totalBreakTime: 1800, // 30 minutes
  sessionsCompleted: 14,
  averageSessionLength: 1500, // 25 minutes
  longestStreak: 7,
  currentStreak: 3,
  productivityScore: 85,
  focusEfficiency: 92,
  breakCompliance: 78,
  dailyGoalCompletion: 80,
  ...overrides,
});

// 事件模拟器
export const simulateKeyboardShortcut = (key: string, modifiers: string[] = []) => {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: modifiers.includes('ctrl') || modifiers.includes('Ctrl'),
    altKey: modifiers.includes('alt') || modifiers.includes('Alt'),
    shiftKey: modifiers.includes('shift') || modifiers.includes('Shift'),
    metaKey: modifiers.includes('meta') || modifiers.includes('Meta'),
    bubbles: true,
  });
  
  document.dispatchEvent(event);
  return event;
};

export const simulateMediaQuery = (query: string, matches: boolean) => {
  const mediaQuery = {
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };

  window.matchMedia = jest.fn().mockImplementation((q) => 
    q === query ? mediaQuery : { matches: false, media: q }
  );

  return mediaQuery;
};

export const simulateIntersectionObserver = (entries: Partial<IntersectionObserverEntry>[]) => {
  const mockObserver = {
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  };

  const mockEntries = entries.map(entry => ({
    isIntersecting: false,
    intersectionRatio: 0,
    target: document.createElement('div'),
    rootBounds: null,
    boundingClientRect: {} as DOMRectReadOnly,
    intersectionRect: {} as DOMRectReadOnly,
    time: Date.now(),
    ...entry,
  }));

  global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
    // 模拟异步调用callback
    setTimeout(() => callback(mockEntries, mockObserver), 0);
    return mockObserver;
  });

  return { mockObserver, mockEntries };
};

// 异步工具
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForAnimation = () => new Promise(resolve => requestAnimationFrame(resolve));

export const waitForTimeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 性能测试工具
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  await waitForNextTick();
  const end = performance.now();
  return end - start;
};

export const measureMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };
  }
  return null;
};

// 可访问性测试工具
export const getByAriaLabel = (container: HTMLElement, label: string) => {
  return container.querySelector(`[aria-label="${label}"]`);
};

export const getByRole = (container: HTMLElement, role: string) => {
  return container.querySelector(`[role="${role}"]`);
};

export const checkAccessibility = (element: HTMLElement) => {
  const issues: string[] = [];

  // 检查是否有alt属性（图片）
  const images = element.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.hasAttribute('alt')) {
      issues.push(`Image ${index + 1} missing alt attribute`);
    }
  });

  // 检查是否有label（表单元素）
  const inputs = element.querySelectorAll('input, select, textarea');
  inputs.forEach((input, index) => {
    const hasLabel = input.hasAttribute('aria-label') || 
                    input.hasAttribute('aria-labelledby') ||
                    element.querySelector(`label[for="${input.id}"]`);
    
    if (!hasLabel) {
      issues.push(`Form element ${index + 1} missing label`);
    }
  });

  // 检查颜色对比度（简化版）
  const elements = element.querySelectorAll('*');
  elements.forEach((el, index) => {
    const styles = window.getComputedStyle(el);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    // 简化的对比度检查
    if (color === backgroundColor) {
      issues.push(`Element ${index + 1} has poor color contrast`);
    }
  });

  return {
    passed: issues.length === 0,
    issues,
  };
};

// 导出默认render函数
export { renderWithProviders as render };

// 重新导出testing-library的所有工具
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';