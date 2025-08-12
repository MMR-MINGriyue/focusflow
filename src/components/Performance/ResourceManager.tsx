/**
 * 资源管理器
 * 提供资源预加载、缓存和懒加载功能
 */

import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { cn } from '../../utils/cn';

// 资源类型
type ResourceType = 'image' | 'audio' | 'video' | 'font' | 'script' | 'style';

// 资源状态
type ResourceStatus = 'idle' | 'loading' | 'loaded' | 'error';

// 资源项
interface ResourceItem {
  id: string;
  url: string;
  type: ResourceType;
  priority: 'high' | 'medium' | 'low';
  preload?: boolean;
  cache?: boolean;
  status: ResourceStatus;
  loadTime?: number;
  error?: string;
}

// 缓存项
interface CacheItem {
  data: any;
  timestamp: number;
  expiry?: number;
  size: number;
}

// 资源管理器上下文
interface ResourceManagerContext {
  resources: Map<string, ResourceItem>;
  cache: Map<string, CacheItem>;
  loadResource: (resource: Omit<ResourceItem, 'status'>) => Promise<any>;
  preloadResources: (resources: Omit<ResourceItem, 'status'>[]) => Promise<void>;
  getCachedData: (key: string) => any;
  setCachedData: (key: string, data: any, expiry?: number) => void;
  clearCache: () => void;
  getResourceStats: () => ResourceStats;
}

// 资源统计
interface ResourceStats {
  totalResources: number;
  loadedResources: number;
  failedResources: number;
  cacheSize: number;
  cacheHitRate: number;
  averageLoadTime: number;
}

const ResourceContext = createContext<ResourceManagerContext | null>(null);

// 资源管理器Provider
export const ResourceManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [resources] = useState(new Map<string, ResourceItem>());
  const [cache] = useState(new Map<string, CacheItem>());
  const cacheHits = useRef(0);
  const cacheMisses = useRef(0);

  // 加载资源
  const loadResource = useCallback(async (resource: Omit<ResourceItem, 'status'>): Promise<any> => {
    const startTime = performance.now();
    const resourceItem: ResourceItem = { ...resource, status: 'loading' };
    resources.set(resource.id, resourceItem);

    try {
      let data: any;

      switch (resource.type) {
        case 'image':
          data = await loadImage(resource.url);
          break;
        case 'audio':
          data = await loadAudio(resource.url);
          break;
        case 'video':
          data = await loadVideo(resource.url);
          break;
        case 'font':
          data = await loadFont(resource.url);
          break;
        case 'script':
          data = await loadScript(resource.url);
          break;
        case 'style':
          data = await loadStyle(resource.url);
          break;
        default:
          throw new Error(`Unsupported resource type: ${resource.type}`);
      }

      const loadTime = performance.now() - startTime;
      const updatedResource: ResourceItem = {
        ...resourceItem,
        status: 'loaded',
        loadTime
      };
      resources.set(resource.id, updatedResource);

      // 缓存资源
      if (resource.cache !== false) {
        const cacheItem: CacheItem = {
          data,
          timestamp: Date.now(),
          expiry: resource.cache === true ? undefined : Date.now() + (24 * 60 * 60 * 1000), // 24小时
          size: estimateSize(data)
        };
        cache.set(resource.id, cacheItem);
      }

      return data;
    } catch (error) {
      const updatedResource: ResourceItem = {
        ...resourceItem,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      resources.set(resource.id, updatedResource);
      throw error;
    }
  }, [resources, cache]);

  // 预加载资源
  const preloadResources = useCallback(async (resourceList: Omit<ResourceItem, 'status'>[]): Promise<void> => {
    // 按优先级排序
    const sortedResources = resourceList.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // 并发加载高优先级资源
    const highPriorityResources = sortedResources.filter(r => r.priority === 'high');
    const mediumPriorityResources = sortedResources.filter(r => r.priority === 'medium');
    const lowPriorityResources = sortedResources.filter(r => r.priority === 'low');

    try {
      // 高优先级资源并发加载
      await Promise.all(highPriorityResources.map(resource => loadResource(resource)));
      
      // 中优先级资源并发加载
      await Promise.all(mediumPriorityResources.map(resource => loadResource(resource)));
      
      // 低优先级资源逐个加载（避免阻塞）
      for (const resource of lowPriorityResources) {
        try {
          await loadResource(resource);
        } catch (error) {
          console.warn(`Failed to preload low priority resource: ${resource.id}`, error);
        }
      }
    } catch (error) {
      console.error('Failed to preload resources:', error);
    }
  }, [loadResource]);

  // 获取缓存数据
  const getCachedData = useCallback((key: string): any => {
    const cacheItem = cache.get(key);
    
    if (!cacheItem) {
      cacheMisses.current++;
      return null;
    }

    // 检查过期时间
    if (cacheItem.expiry && Date.now() > cacheItem.expiry) {
      cache.delete(key);
      cacheMisses.current++;
      return null;
    }

    cacheHits.current++;
    return cacheItem.data;
  }, [cache]);

  // 设置缓存数据
  const setCachedData = useCallback((key: string, data: any, expiry?: number): void => {
    const cacheItem: CacheItem = {
      data,
      timestamp: Date.now(),
      expiry: expiry ? Date.now() + expiry : undefined,
      size: estimateSize(data)
    };
    cache.set(key, cacheItem);
  }, [cache]);

  // 清除缓存
  const clearCache = useCallback((): void => {
    cache.clear();
    cacheHits.current = 0;
    cacheMisses.current = 0;
  }, [cache]);

  // 获取资源统计
  const getResourceStats = useCallback((): ResourceStats => {
    const resourceArray = Array.from(resources.values());
    const totalResources = resourceArray.length;
    const loadedResources = resourceArray.filter(r => r.status === 'loaded').length;
    const failedResources = resourceArray.filter(r => r.status === 'error').length;
    
    const cacheArray = Array.from(cache.values());
    const cacheSize = cacheArray.reduce((total, item) => total + item.size, 0);
    
    const totalRequests = cacheHits.current + cacheMisses.current;
    const cacheHitRate = totalRequests > 0 ? (cacheHits.current / totalRequests) * 100 : 0;
    
    const loadTimes = resourceArray
      .filter(r => r.loadTime)
      .map(r => r.loadTime!);
    const averageLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
      : 0;

    return {
      totalResources,
      loadedResources,
      failedResources,
      cacheSize,
      cacheHitRate,
      averageLoadTime
    };
  }, [resources, cache]);

  const contextValue: ResourceManagerContext = {
    resources,
    cache,
    loadResource,
    preloadResources,
    getCachedData,
    setCachedData,
    clearCache,
    getResourceStats
  };

  return (
    <ResourceContext.Provider value={contextValue}>
      {children}
    </ResourceContext.Provider>
  );
};

// 使用资源管理器Hook
export const useResourceManager = () => {
  const context = useContext(ResourceContext);
  if (!context) {
    throw new Error('useResourceManager must be used within ResourceManagerProvider');
  }
  return context;
};

// 资源加载函数
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

const loadAudio = (url: string): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.oncanplaythrough = () => resolve(audio);
    audio.onerror = reject;
    audio.src = url;
  });
};

const loadVideo = (url: string): Promise<HTMLVideoElement> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.oncanplaythrough = () => resolve(video);
    video.onerror = reject;
    video.src = url;
  });
};

const loadFont = (url: string): Promise<FontFace> => {
  return new Promise((resolve, reject) => {
    const font = new FontFace('CustomFont', `url(${url})`);
    font.load().then(resolve).catch(reject);
  });
};

const loadScript = (url: string): Promise<HTMLScriptElement> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.onload = () => resolve(script);
    script.onerror = reject;
    script.src = url;
    document.head.appendChild(script);
  });
};

const loadStyle = (url: string): Promise<HTMLLinkElement> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.onload = () => resolve(link);
    link.onerror = reject;
    link.href = url;
    document.head.appendChild(link);
  });
};

// 估算数据大小
const estimateSize = (data: any): number => {
  if (typeof data === 'string') {
    return data.length * 2; // UTF-16
  }
  if (data instanceof HTMLImageElement) {
    return data.width * data.height * 4; // RGBA
  }
  if (data instanceof HTMLAudioElement || data instanceof HTMLVideoElement) {
    return 1024 * 1024; // 估算1MB
  }
  return JSON.stringify(data).length * 2;
};

// 懒加载图片组件
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { getCachedData, setCachedData } = useResourceManager();

  // 交叉观察器
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  // 加载图片
  useEffect(() => {
    if (!isInView) return;

    // 检查缓存
    const cachedImage = getCachedData(src);
    if (cachedImage) {
      setIsLoaded(true);
      onLoad?.();
      return;
    }

    // 加载新图片
    const img = new Image();
    img.onload = () => {
      setCachedData(src, img);
      setIsLoaded(true);
      onLoad?.();
    };
    img.onerror = () => {
      setHasError(true);
      onError?.();
    };
    img.src = src;
  }, [isInView, src, getCachedData, setCachedData, onLoad, onError]);

  return (
    <img
      ref={imgRef}
      src={isLoaded ? src : placeholder}
      alt={alt}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        hasError && 'opacity-50',
        className
      )}
      {...props}
    />
  );
};

// 预加载Hook
export const usePreloader = () => {
  const { preloadResources } = useResourceManager();
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);

  const preload = useCallback(async (resources: Omit<ResourceItem, 'status'>[]) => {
    setIsPreloading(true);
    setPreloadProgress(0);

    try {
      let loadedCount = 0;
      const totalCount = resources.length;

      // 创建带进度的加载Promise
      const loadWithProgress = resources.map(async (resource) => {
        try {
          await preloadResources([resource]);
          loadedCount++;
          setPreloadProgress((loadedCount / totalCount) * 100);
        } catch (error) {
          console.warn(`Failed to preload resource: ${resource.id}`, error);
          loadedCount++;
          setPreloadProgress((loadedCount / totalCount) * 100);
        }
      });

      await Promise.all(loadWithProgress);
    } finally {
      setIsPreloading(false);
      setPreloadProgress(100);
    }
  }, [preloadResources]);

  return { preload, isPreloading, preloadProgress };
};

// 缓存Hook
export const useCache = <T,>(key: string, fetcher: () => Promise<T>, expiry?: number) => {
  const { getCachedData, setCachedData } = useResourceManager();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // 检查缓存
    const cachedData = getCachedData(key);
    if (cachedData) {
      setData(cachedData);
      return cachedData;
    }

    // 获取新数据
    setIsLoading(true);
    setError(null);

    try {
      const newData = await fetcher();
      setCachedData(key, newData, expiry);
      setData(newData);
      return newData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, expiry, getCachedData, setCachedData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
};

// 资源统计组件
export const ResourceStats: React.FC<{ className?: string }> = ({ className }) => {
  const { getResourceStats } = useResourceManager();
  const [stats, setStats] = useState<ResourceStats>(getResourceStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getResourceStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [getResourceStats]);

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 gap-4', className)}>
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="text-sm text-muted-foreground">总资源</div>
        <div className="text-lg font-bold">{stats.totalResources}</div>
      </div>
      
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="text-sm text-muted-foreground">已加载</div>
        <div className="text-lg font-bold text-green-600">{stats.loadedResources}</div>
      </div>
      
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="text-sm text-muted-foreground">加载失败</div>
        <div className="text-lg font-bold text-red-600">{stats.failedResources}</div>
      </div>
      
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="text-sm text-muted-foreground">缓存大小</div>
        <div className="text-lg font-bold">{(stats.cacheSize / 1024 / 1024).toFixed(1)}MB</div>
      </div>
      
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="text-sm text-muted-foreground">缓存命中率</div>
        <div className="text-lg font-bold">{stats.cacheHitRate.toFixed(1)}%</div>
      </div>
      
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="text-sm text-muted-foreground">平均加载时间</div>
        <div className="text-lg font-bold">{stats.averageLoadTime.toFixed(1)}ms</div>
      </div>
    </div>
  );
};

export default {
  ResourceManagerProvider,
  useResourceManager,
  LazyImage,
  usePreloader,
  useCache,
  ResourceStats
};