/**
 * 增强的API客户端
 * 提供请求拦截、响应拦截、错误处理和缓存功能
 */

import { AppError, ErrorType } from '../utils';

/**
 * 请求配置
 */
export interface RequestConfig {
  /**
   * 请求URL
   */
  url: string;
  /**
   * 请求方法
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  /**
   * 请求头
   */
  headers?: Record<string, string>;
  /**
   * 请求参数
   */
  params?: Record<string, any>;
  /**
   * 请求体
   */
  data?: any;
  /**
   * 超时时间（毫秒）
   */
  timeout?: number;
  /**
   * 是否携带凭证
   */
  withCredentials?: boolean;
  /**
   * 响应类型
   */
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'document';
  /**
   * 是否启用缓存
   */
  enableCache?: boolean;
  /**
   * 缓存时间（毫秒）
   */
  cacheTime?: number;
  /**
   * 是否启用重试
   */
  enableRetry?: boolean;
  /**
   * 重试次数
   */
  retryCount?: number;
  /**
   * 重试延迟（毫秒）
   */
  retryDelay?: number;
  /**
   * 是否启用模拟数据
   */
  enableMock?: boolean;
  /**
   * 模拟数据
   */
  mockData?: any;
  /**
   * 自定义配置
   */
  custom?: Record<string, any>;
}

/**
 * 响应数据
 */
export interface ResponseData<T = any> {
  /**
   * 状态码
   */
  code: number;
  /**
   * 消息
   */
  message: string;
  /**
   * 数据
   */
  data: T;
  /**
   * 时间戳
   */
  timestamp: number;
}

/**
 * 请求拦截器
 */
export interface RequestInterceptor {
  /**
   * 拦截函数
   */
  onFulfilled?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  /**
   * 错误拦截函数
   */
  onRejected?: (error: any) => any;
}

/**
 * 响应拦截器
 */
export interface ResponseInterceptor {
  /**
   * 拦截函数
   */
  onFulfilled?: (response: Response) => Response | Promise<Response>;
  /**
   * 错误拦截函数
   */
  onRejected?: (error: any) => any;
}

/**
 * API客户端选项
 */
export interface ApiClientOptions {
  /**
   * 基础URL
   */
  baseURL?: string;
  /**
   * 默认请求头
   */
  headers?: Record<string, string>;
  /**
   * 默认超时时间（毫秒）
   */
  timeout?: number;
  /**
   * 是否携带凭证
   */
  withCredentials?: boolean;
  /**
   * 是否启用缓存
   */
  enableCache?: boolean;
  /**
   * 默认缓存时间（毫秒）
   */
  defaultCacheTime?: number;
  /**
   * 是否启用重试
   */
  enableRetry?: boolean;
  /**
   * 默认重试次数
   */
  defaultRetryCount?: number;
  /**
   * 默认重试延迟（毫秒）
   */
  defaultRetryDelay?: number;
  /**
   * 是否启用模拟数据
   */
  enableMock?: boolean;
  /**
   * 请求拦截器
   */
  requestInterceptors?: RequestInterceptor[];
  /**
   * 响应拦截器
   */
  responseInterceptors?: ResponseInterceptor[];
}

/**
 * 缓存项
 */
interface CacheItem {
  /**
   * 响应数据
   */
  response: Response;
  /**
   * 过期时间
   */
  expireTime: number;
}

/**
 * 增强的API客户端
 */
export class ApiClient {
  private baseURL: string;
  private headers: Record<string, string>;
  private timeout: number;
  private withCredentials: boolean;
  private enableCache: boolean;
  private defaultCacheTime: number;
  private enableRetry: boolean;
  private defaultRetryCount: number;
  private defaultRetryDelay: number;
  private enableMock: boolean;
  private requestInterceptors: RequestInterceptor[];
  private responseInterceptors: ResponseInterceptor[];
  private cache: Map<string, CacheItem>;

  constructor(options: ApiClientOptions = {}) {
    this.baseURL = options.baseURL || '';
    this.headers = options.headers || {};
    this.timeout = options.timeout || 10000;
    this.withCredentials = options.withCredentials || false;
    this.enableCache = options.enableCache ?? true;
    this.defaultCacheTime = options.defaultCacheTime || 5 * 60 * 1000; // 5分钟
    this.enableRetry = options.enableRetry ?? true;
    this.defaultRetryCount = options.defaultRetryCount || 3;
    this.defaultRetryDelay = options.defaultRetryDelay || 1000;
    this.enableMock = options.enableMock ?? false;
    this.requestInterceptors = options.requestInterceptors || [];
    this.responseInterceptors = options.responseInterceptors || [];
    this.cache = new Map();
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(config: RequestConfig): string {
    const { url, method = 'GET', params, data } = config;
    const key = `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
    return key;
  }

  /**
   * 获取缓存
   */
  private getCache(key: string): Response | null {
    if (!this.enableCache) return null;

    const cacheItem = this.cache.get(key);
    if (!cacheItem) return null;

    // 检查是否过期
    if (Date.now() > cacheItem.expireTime) {
      this.cache.delete(key);
      return null;
    }

    return cacheItem.response;
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, response: Response, cacheTime?: number): void {
    if (!this.enableCache) return;

    const expireTime = Date.now() + (cacheTime || this.defaultCacheTime);
    this.cache.set(key, {
      response,
      expireTime,
    });
  }

  /**
   * 清除缓存
   */
  private clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 执行请求拦截器
   */
  private async executeRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;

    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onFulfilled) {
        processedConfig = await interceptor.onFulfilled(processedConfig);
      }
    }

    return processedConfig;
  }

  /**
   * 执行响应拦截器
   */
  private async executeResponseInterceptors(response: Response): Promise<Response> {
    let processedResponse = response;

    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onFulfilled) {
        processedResponse = await interceptor.onFulfilled(processedResponse);
      }
    }

    return processedResponse;
  }

  /**
   * 执行请求拦截器错误处理
   */
  private async executeRequestInterceptorError(error: any): Promise<any> {
    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onRejected) {
        try {
          error = await interceptor.onRejected(error);
        } catch (err) {
          error = err;
        }
      }
    }

    return Promise.reject(error);
  }

  /**
   * 执行响应拦截器错误处理
   */
  private async executeResponseInterceptorError(error: any): Promise<any> {
    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onRejected) {
        try {
          error = await interceptor.onRejected(error);
        } catch (err) {
          error = err;
        }
      }
    }

    return Promise.reject(error);
  }

  /**
   * 重试请求
   */
  private async retryRequest(
    config: RequestConfig,
    error: any,
    retryCount: number,
    retryDelay: number
  ): Promise<Response> {
    if (retryCount <= 0) {
      throw error;
    }

    // 等待延迟
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    // 重试请求
    return this.request({
      ...config,
      enableRetry: false, // 避免无限重试
    });
  }

  /**
   * 处理错误
   */
  private handleError(error: any): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Response) {
      return AppError.server(
        `HTTP Error: ${error.status} ${error.statusText}`,
        new Error(error.statusText)
      );
    }

    if (error.name === 'AbortError') {
      return AppError.client('请求超时', error);
    }

    if (error.name === 'TypeError') {
      return AppError.network('网络错误，请检查您的网络连接', error);
    }

    return AppError.unknown('未知错误', error);
  }

  /**
   * 构建URL
   */
  private buildURL(url: string, params?: Record<string, any>): string {
    let finalURL = this.baseURL ? `${this.baseURL}${url}` : url;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(item => searchParams.append(key, String(item)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });

      const queryString = searchParams.toString();
      if (queryString) {
        finalURL += `${finalURL.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    return finalURL;
  }

  /**
   * 构建请求头
   */
  private buildHeaders(headers?: Record<string, string>): Headers {
    const finalHeaders = new Headers(this.headers);

    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        finalHeaders.set(key, value);
      });
    }

    return finalHeaders;
  }

  /**
   * 发送请求
   */
  async request<T = any>(config: RequestConfig): Promise<ResponseData<T>> {
    try {
      // 执行请求拦截器
      const processedConfig = await this.executeRequestInterceptors(config);

      // 检查缓存
      const cacheKey = this.generateCacheKey(processedConfig);
      const cachedResponse = this.getCache(cacheKey);
      if (cachedResponse) {
        return this.parseResponse<T>(cachedResponse);
      }

      // 检查是否启用模拟数据
      if (processedConfig.enableMock ?? this.enableMock) {
        if (processedConfig.mockData) {
          return {
            code: 200,
            message: 'success',
            data: processedConfig.mockData,
            timestamp: Date.now(),
          };
        }
      }

      // 构建请求
      const url = this.buildURL(processedConfig.url, processedConfig.params);
      const headers = this.buildHeaders(processedConfig.headers);
      const options: RequestInit = {
        method: processedConfig.method || 'GET',
        headers,
        credentials: processedConfig.withCredentials ?? this.withCredentials ? 'include' : 'same-origin',
      };

      // 添加请求体
      if (processedConfig.data && !['GET', 'HEAD', 'OPTIONS'].includes(processedConfig.method || 'GET')) {
        if (processedConfig.headers?.['Content-Type']?.includes('application/json')) {
          options.body = JSON.stringify(processedConfig.data);
        } else {
          options.body = processedConfig.data;
        }
      }

      // 设置超时
      const timeout = processedConfig.timeout ?? this.timeout;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      options.signal = controller.signal;

      // 发送请求
      let response: Response;
      try {
        response = await fetch(url, options);
      } catch (error) {
        // 检查是否需要重试
        if (processedConfig.enableRetry ?? this.enableRetry) {
          const retryCount = processedConfig.retryCount ?? this.defaultRetryCount;
          const retryDelay = processedConfig.retryDelay ?? this.defaultRetryDelay;

          if (retryCount > 0) {
            clearTimeout(timeoutId);
            response = await this.retryRequest(processedConfig, error, retryCount, retryDelay);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      } finally {
        clearTimeout(timeoutId);
      }

      // 执行响应拦截器
      const processedResponse = await this.executeResponseInterceptors(response);

      // 设置缓存
      if (processedConfig.enableCache ?? this.enableCache) {
        const cacheTime = processedConfig.cacheTime ?? this.defaultCacheTime;
        this.setCache(cacheKey, processedResponse, cacheTime);
      }

      // 解析响应
      return this.parseResponse<T>(processedResponse);
    } catch (error) {
      // 执行请求拦截器错误处理
      try {
        await this.executeRequestInterceptorError(error);
      } catch (processedError) {
        // 执行响应拦截器错误处理
        try {
          await this.executeResponseInterceptorError(processedError);
        } catch (finalError) {
          throw this.handleError(finalError);
        }
      }

      throw this.handleError(error);
    }
  }

  /**
   * 解析响应
   */
  private async parseResponse<T>(response: Response): Promise<ResponseData<T>> {
    // 检查响应状态
    if (!response.ok) {
      throw response;
    }

    // 解析响应体
    let data: any;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }

    // 如果响应已经是标准格式，直接返回
    if (data && typeof data === 'object' && 'code' in data && 'data' in data) {
      return data as ResponseData<T>;
    }

    // 否则包装成标准格式
    return {
      code: response.status,
      message: response.statusText || 'success',
      data: data as T,
      timestamp: Date.now(),
    };
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, config: Omit<RequestConfig, 'url' | 'method'> = {}): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  /**
   * POST请求
   */
  async post<T = any>(url: string, data?: any, config: Omit<RequestConfig, 'url' | 'method' | 'data'> = {}): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'POST', data });
  }

  /**
   * PUT请求
   */
  async put<T = any>(url: string, data?: any, config: Omit<RequestConfig, 'url' | 'method' | 'data'> = {}): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', data });
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string, config: Omit<RequestConfig, 'url' | 'method'> = {}): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(url: string, data?: any, config: Omit<RequestConfig, 'url' | 'method' | 'data'> = {}): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', data });
  }

  /**
   * HEAD请求
   */
  async head<T = any>(url: string, config: Omit<RequestConfig, 'url' | 'method'> = {}): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'HEAD' });
  }

  /**
   * OPTIONS请求
   */
  async options<T = any>(url: string, config: Omit<RequestConfig, 'url' | 'method'> = {}): Promise<ResponseData<T>> {
    return this.request<T>({ ...config, url, method: 'OPTIONS' });
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * 移除请求拦截器
   */
  removeRequestInterceptor(interceptor: RequestInterceptor): void {
    const index = this.requestInterceptors.indexOf(interceptor);
    if (index !== -1) {
      this.requestInterceptors.splice(index, 1);
    }
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * 移除响应拦截器
   */
  removeResponseInterceptor(interceptor: ResponseInterceptor): void {
    const index = this.responseInterceptors.indexOf(interceptor);
    if (index !== -1) {
      this.responseInterceptors.splice(index, 1);
    }
  }

  /**
   * 清除缓存
   */
  clearCache(url?: string, method?: string, params?: Record<string, any>, data?: any): void {
    if (url) {
      const config: RequestConfig = { url, method, params, data };
      const key = this.generateCacheKey(config);
      this.clearCache(key);
    } else {
      this.clearCache();
    }
  }

  /**
   * 设置基础URL
   */
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
  }

  /**
   * 设置默认请求头
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.headers = { ...this.headers, ...headers };
  }

  /**
   * 设置默认超时时间
   */
  setDefaultTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  /**
   * 设置是否携带凭证
   */
  setWithCredentials(withCredentials: boolean): void {
    this.withCredentials = withCredentials;
  }

  /**
   * 设置是否启用缓存
   */
  setEnableCache(enableCache: boolean): void {
    this.enableCache = enableCache;
  }

  /**
   * 设置默认缓存时间
   */
  setDefaultCacheTime(cacheTime: number): void {
    this.defaultCacheTime = cacheTime;
  }

  /**
   * 设置是否启用重试
   */
  setEnableRetry(enableRetry: boolean): void {
    this.enableRetry = enableRetry;
  }

  /**
   * 设置默认重试次数
   */
  setDefaultRetryCount(retryCount: number): void {
    this.defaultRetryCount = retryCount;
  }

  /**
   * 设置默认重试延迟
   */
  setDefaultRetryDelay(retryDelay: number): void {
    this.defaultRetryDelay = retryDelay;
  }

  /**
   * 设置是否启用模拟数据
   */
  setEnableMock(enableMock: boolean): void {
    this.enableMock = enableMock;
  }
}

/**
 * 创建API客户端
 */
export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  return new ApiClient(options);
}
