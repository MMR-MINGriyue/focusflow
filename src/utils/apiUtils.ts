/**
 * API工具函数
 * 提供HTTP请求封装和错误处理功能
 */

// import { settingsStore } from '../stores/settingsStore'; // 暂时注释掉未使用的导入

// API配置
interface ApiConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// 请求选项
interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  timeout?: number;
  isFormData?: boolean;
}

// API响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 获取认证头
 */
export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * 创建API客户端
 */
export function createApiClient(config: ApiConfig = {}) {
  const baseURL = config.baseURL || 'https://api.focusflow.app';
  const timeout = config.timeout || 10000;

  return {
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    }
  };
}

/**
 * 处理API错误
 */
export function handleApiError(error: any): never {
  if (error.name === 'AbortError') {
    throw new Error('请求超时');
  }
  
  if (error.response) {
    const message = error.response.data?.error || error.response.data?.message || '请求失败';
    throw new Error(message);
  }
  
  if (error.request) {
    throw new Error('网络错误，请检查网络连接');
  }
  
  throw new Error(error.message || '未知错误');
}

/**
 * 构建URL
 */
function buildURL(baseURL: string, endpoint: string, params?: Record<string, any>): string {
  const url = new URL(endpoint, baseURL);
  
  if (params) {
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, String(params[key]));
      }
    });
  }
  
  return url.toString();
}

/**
 * 发送HTTP请求
 */
async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, timeout, isFormData, ...fetchOptions } = options;
  const client = createApiClient();
  
  const url = buildURL(client.baseURL, endpoint, params);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout || client.timeout);
  
  const headers = {
    ...client.headers,
    ...getAuthHeader(),
    ...fetchOptions.headers,
  };
  
  // 如果是FormData，删除Content-Type让浏览器自动设置
  if (isFormData) {
    delete (headers as any)['Content-Type'];
  }
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).response = response;
      throw error;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return (await response.text()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    handleApiError(error);
  }
}

/**
 * GET请求
 */
export async function fetchData<T = any>(
  endpoint: string,
  options?: Omit<RequestOptions, 'method'>
): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST请求
 */
export async function postData<T = any>(
  endpoint: string,
  data?: any,
  options?: Omit<RequestOptions, 'method'>
): Promise<T> {
  const isFormData = data instanceof FormData;
  return request<T>(endpoint, {
    ...options,
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
    isFormData,
  });
}

/**
 * PUT请求
 */
export async function putData<T = any>(
  endpoint: string,
  data?: any,
  options?: Omit<RequestOptions, 'method'>
): Promise<T> {
  return request<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE请求
 */
export async function deleteData<T = any>(
  endpoint: string,
  options?: Omit<RequestOptions, 'method'>
): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'DELETE' });
}

// 默认导出
export default {
  fetchData,
  postData,
  putData,
  deleteData,
  handleApiError,
  createApiClient,
  getAuthHeader,
};