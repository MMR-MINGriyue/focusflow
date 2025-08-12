/**
 * 屏幕尺寸检测Hook
 * 提供屏幕尺寸信息和响应式断点检测
 */

import { useState, useEffect, useCallback } from 'react';

// 断点配置
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// 屏幕尺寸信息
export interface ScreenSize {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallScreen: boolean;
  isLargeScreen: boolean;
  orientation: 'portrait' | 'landscape';
  aspectRatio: number;
  pixelRatio: number;
}

// 媒体查询匹配结果
export interface MediaQueryMatches {
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  '2xl': boolean;
  smUp: boolean;
  mdUp: boolean;
  lgUp: boolean;
  xlUp: boolean;
  '2xlUp': boolean;
  smDown: boolean;
  mdDown: boolean;
  lgDown: boolean;
  xlDown: boolean;
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
  touch: boolean;
  hover: boolean;
  reducedMotion: boolean;
  darkMode: boolean;
  highContrast: boolean;
}

/**
 * 获取当前断点
 */
const getCurrentBreakpoint = (width: number): Breakpoint => {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  return 'sm';
};

/**
 * 获取屏幕尺寸信息
 */
const getScreenSize = (): ScreenSize => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const breakpoint = getCurrentBreakpoint(width);
  
  return {
    width,
    height,
    breakpoint,
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    isSmallScreen: width < BREAKPOINTS.lg,
    isLargeScreen: width >= BREAKPOINTS.xl,
    orientation: width > height ? 'landscape' : 'portrait',
    aspectRatio: width / height,
    pixelRatio: window.devicePixelRatio || 1
  };
};

/**
 * 获取媒体查询匹配结果
 */
const getMediaQueryMatches = (): MediaQueryMatches => {
  const width = window.innerWidth;
  
  return {
    // 精确匹配
    sm: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
    md: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    lg: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
    xl: width >= BREAKPOINTS.xl && width < BREAKPOINTS['2xl'],
    '2xl': width >= BREAKPOINTS['2xl'],
    
    // 向上匹配
    smUp: width >= BREAKPOINTS.sm,
    mdUp: width >= BREAKPOINTS.md,
    lgUp: width >= BREAKPOINTS.lg,
    xlUp: width >= BREAKPOINTS.xl,
    '2xlUp': width >= BREAKPOINTS['2xl'],
    
    // 向下匹配
    smDown: width < BREAKPOINTS.md,
    mdDown: width < BREAKPOINTS.lg,
    lgDown: width < BREAKPOINTS.xl,
    xlDown: width < BREAKPOINTS['2xl'],
    
    // 设备类型
    mobile: width < BREAKPOINTS.md,
    tablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    desktop: width >= BREAKPOINTS.lg,
    
    // 功能检测
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hover: window.matchMedia('(hover: hover)').matches,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    highContrast: window.matchMedia('(prefers-contrast: high)').matches
  };
};

/**
 * 屏幕尺寸检测Hook
 */
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        breakpoint: 'lg' as Breakpoint,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isSmallScreen: false,
        isLargeScreen: true,
        orientation: 'landscape' as const,
        aspectRatio: 1024 / 768,
        pixelRatio: 1
      };
    }
    return getScreenSize();
  });

  const updateScreenSize = useCallback(() => {
    setScreenSize(getScreenSize());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 防抖处理
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScreenSize, 100);
    };

    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', debouncedUpdate);

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
      clearTimeout(timeoutId);
    };
  }, [updateScreenSize]);

  return screenSize;
};

/**
 * 媒体查询匹配Hook
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    setMatches(mediaQuery.matches);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

/**
 * 多媒体查询匹配Hook
 */
export const useMediaQueries = () => {
  const [matches, setMatches] = useState<MediaQueryMatches>(() => {
    if (typeof window === 'undefined') {
      return {
        sm: false, md: false, lg: true, xl: true, '2xl': false,
        smUp: true, mdUp: true, lgUp: true, xlUp: true, '2xlUp': false,
        smDown: false, mdDown: false, lgDown: false, xlDown: true,
        mobile: false, tablet: false, desktop: true,
        touch: false, hover: true, reducedMotion: false, darkMode: false, highContrast: false
      };
    }
    return getMediaQueryMatches();
  });

  const updateMatches = useCallback(() => {
    setMatches(getMediaQueryMatches());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 监听窗口大小变化
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateMatches, 100);
    };

    window.addEventListener('resize', debouncedUpdate);

    // 监听媒体查询变化
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(hover: hover)')
    ];

    const handleMediaQueryChange = () => updateMatches();

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', handleMediaQueryChange);
    });

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', handleMediaQueryChange);
      });
      clearTimeout(timeoutId);
    };
  }, [updateMatches]);

  return matches;
};

/**
 * 断点匹配Hook
 */
export const useBreakpoint = (breakpoint: Breakpoint): boolean => {
  const screenSize = useScreenSize();
  
  switch (breakpoint) {
    case 'sm':
      return screenSize.width >= BREAKPOINTS.sm && screenSize.width < BREAKPOINTS.md;
    case 'md':
      return screenSize.width >= BREAKPOINTS.md && screenSize.width < BREAKPOINTS.lg;
    case 'lg':
      return screenSize.width >= BREAKPOINTS.lg && screenSize.width < BREAKPOINTS.xl;
    case 'xl':
      return screenSize.width >= BREAKPOINTS.xl && screenSize.width < BREAKPOINTS['2xl'];
    case '2xl':
      return screenSize.width >= BREAKPOINTS['2xl'];
    default:
      return false;
  }
};

/**
 * 断点向上匹配Hook
 */
export const useBreakpointUp = (breakpoint: Breakpoint): boolean => {
  const screenSize = useScreenSize();
  return screenSize.width >= BREAKPOINTS[breakpoint];
};

/**
 * 断点向下匹配Hook
 */
export const useBreakpointDown = (breakpoint: Breakpoint): boolean => {
  const screenSize = useScreenSize();
  const breakpoints = Object.keys(BREAKPOINTS) as Breakpoint[];
  const currentIndex = breakpoints.indexOf(breakpoint);
  const nextBreakpoint = breakpoints[currentIndex + 1];
  
  if (!nextBreakpoint) return true;
  return screenSize.width < BREAKPOINTS[nextBreakpoint];
};

/**
 * 设备类型检测Hook
 */
export const useDeviceType = () => {
  const screenSize = useScreenSize();
  const mediaQueries = useMediaQueries();
  
  return {
    isMobile: screenSize.isMobile,
    isTablet: screenSize.isTablet,
    isDesktop: screenSize.isDesktop,
    isTouch: mediaQueries.touch,
    hasHover: mediaQueries.hover,
    isPortrait: screenSize.orientation === 'portrait',
    isLandscape: screenSize.orientation === 'landscape',
    isHighDPI: screenSize.pixelRatio > 1,
    isRetina: screenSize.pixelRatio >= 2
  };
};

/**
 * 响应式值Hook
 */
export const useResponsiveValue = <T>(values: {
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
  default: T;
}): T => {
  const screenSize = useScreenSize();
  
  // 根据当前断点返回对应的值
  const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm'];
  
  for (const bp of breakpointOrder) {
    if (screenSize.width >= BREAKPOINTS[bp] && values[bp] !== undefined) {
      return values[bp]!;
    }
  }
  
  return values.default;
};

/**
 * 视口尺寸Hook
 */
export const useViewportSize = () => {
  const [size, setSize] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1024, height: 768 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSize, 100);
    };

    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', debouncedUpdate);

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
      clearTimeout(timeoutId);
    };
  }, []);

  return size;
};

export default useScreenSize;