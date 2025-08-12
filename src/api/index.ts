/**
 * 数据层和API管理索引文件
 * 统一导出所有数据层和API管理功能，方便使用
 */

// API客户端
export {
  ApiClient,
  type RequestConfig,
  type ResponseData,
  type RequestInterceptor,
  type ResponseInterceptor,
  type ApiClientOptions,
} from './ApiClient';

// 数据存储管理器
export {
  DataStoreManager,
  type StoreConfig,
  type StoreItem,
  type StoreEvent,
  type StoreEventType,
  type DataStoreManagerOptions,
} from '../store/DataStoreManager';

// 数据模型管理器
export {
  ModelManager,
  type ModelDefinition,
  type FieldDefinition,
  type IndexDefinition,
  type AssociationDefinition,
  type ModelInstance,
  type ValidationError,
  type ModelManagerOptions,
  type FieldType,
} from '../model/ModelManager';

// 创建API客户端
export const createApiClient = (options?: ApiClientOptions) => {
  return new ApiClient(options);
};

// 创建数据存储管理器
export const createDataStoreManager = (options?: DataStoreManagerOptions) => {
  return new DataStoreManager(options);
};

// 创建数据模型管理器
export const createModelManager = (options?: ModelManagerOptions) => {
  return new ModelManager(options);
};

// 预定义API配置
export const predefinedApiConfig = {
  baseURL: process.env.API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
  enableCache: true,
  defaultCacheTime: 5 * 60 * 1000, // 5分钟
  enableRetry: true,
  defaultRetryCount: 3,
  defaultRetryDelay: 1000,
};

// 预定义存储配置
export const predefinedStoreConfigs = {
  user: {
    type: StoreType.LOCAL,
    persist: true,
    key: 'app-user',
  },
  settings: {
    type: StoreType.LOCAL,
    persist: true,
    key: 'app-settings',
  },
  cache: {
    type: StoreType.MEMORY,
    persist: false,
  },
  session: {
    type: StoreType.SESSION,
    persist: true,
    key: 'app-session',
  },
  remote: {
    type: StoreType.REMOTE,
    persist: false,
    apiConfig: {
      getApi: '/data',
      updateApi: '/data',
      deleteApi: '/data',
    },
  },
};

// 预定义用户模型
export const userModel: ModelDefinition = {
  name: 'User',
  label: '用户',
  description: '用户模型',
  fields: [
    {
      name: 'id',
      type: FieldType.STRING,
      label: 'ID',
      required: true,
      readonly: true,
    },
    {
      name: 'username',
      type: FieldType.STRING,
      label: '用户名',
      required: true,
      minLength: 3,
      maxLength: 20,
      pattern: '^[a-zA-Z0-9_]+$',
    },
    {
      name: 'email',
      type: FieldType.STRING,
      label: '邮箱',
      required: true,
      pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$',
    },
    {
      name: 'password',
      type: FieldType.STRING,
      label: '密码',
      required: true,
      minLength: 6,
      hidden: true,
    },
    {
      name: 'avatar',
      type: FieldType.STRING,
      label: '头像',
    },
    {
      name: 'role',
      type: FieldType.STRING,
      label: '角色',
      required: true,
      defaultValue: 'user',
      enum: ['admin', 'user', 'guest'],
    },
    {
      name: 'status',
      type: FieldType.STRING,
      label: '状态',
      required: true,
      defaultValue: 'active',
      enum: ['active', 'inactive', 'banned'],
    },
    {
      name: 'createdAt',
      type: FieldType.DATE,
      label: '创建时间',
      readonly: true,
    },
    {
      name: 'updatedAt',
      type: FieldType.DATE,
      label: '更新时间',
      readonly: true,
    },
  ],
  indexes: [
    {
      name: 'username',
      fields: ['username'],
      unique: true,
    },
    {
      name: 'email',
      fields: ['email'],
      unique: true,
    },
  ],
  hooks: {
    beforeCreate: (data) => {
      data.createdAt = new Date();
      data.updatedAt = new Date();
      return data;
    },
    beforeUpdate: (data) => {
      data.updatedAt = new Date();
      return data;
    },
  },
};

// 预定义设置模型
export const settingsModel: ModelDefinition = {
  name: 'Settings',
  label: '设置',
  description: '设置模型',
  fields: [
    {
      name: 'id',
      type: FieldType.STRING,
      label: 'ID',
      required: true,
      readonly: true,
    },
    {
      name: 'theme',
      type: FieldType.STRING,
      label: '主题',
      required: true,
      defaultValue: 'light',
      enum: ['light', 'dark', 'system'],
    },
    {
      name: 'language',
      type: FieldType.STRING,
      label: '语言',
      required: true,
      defaultValue: 'zh-CN',
    },
    {
      name: 'notifications',
      type: FieldType.OBJECT,
      label: '通知设置',
      defaultValue: {
        email: true,
        push: true,
        sms: false,
      },
    },
    {
      name: 'privacy',
      type: FieldType.OBJECT,
      label: '隐私设置',
      defaultValue: {
        profileVisible: true,
        activityVisible: true,
        dataCollection: true,
      },
    },
    {
      name: 'createdAt',
      type: FieldType.DATE,
      label: '创建时间',
      readonly: true,
    },
    {
      name: 'updatedAt',
      type: FieldType.DATE,
      label: '更新时间',
      readonly: true,
    },
  ],
  hooks: {
    beforeCreate: (data) => {
      data.createdAt = new Date();
      data.updatedAt = new Date();
      return data;
    },
    beforeUpdate: (data) => {
      data.updatedAt = new Date();
      return data;
    },
  },
};

// 数据层上下文
export interface DataContext {
  /**
   * API客户端
   */
  api: ApiClient;
  /**
   * 数据存储管理器
   */
  store: DataStoreManager;
  /**
   * 数据模型管理器
   */
  model: ModelManager;
  /**
   * 初始化数据层
   */
  initialize: () => Promise<void>;
  /**
   * 销毁数据层
   */
  destroy: () => void;
}

// 创建数据层上下文
export const createDataContext = (): DataContext => {
  const api = createApiClient(predefinedApiConfig);
  const store = createDataStoreManager({
    enableAutoSync: true,
    syncInterval: 5 * 60 * 1000, // 5分钟
    enableOfflineMode: true,
  });
  const model = createModelManager({
    strictMode: true,
    autoValidate: true,
    autoTransform: true,
  });

  return {
    api,
    store,
    model,
    initialize: async () => {
      // 初始化数据层
      console.log('Initializing data layer...');

      // 创建存储
      Object.entries(predefinedStoreConfigs).forEach(([name, config]) => {
        store.createStore(name, config);
      });

      // 注册模型
      model.registerModel(userModel);
      model.registerModel(settingsModel);

      // 这里可以添加其他初始化逻辑
    },
    destroy: () => {
      // 销毁数据层
      console.log('Destroying data layer...');

      // 销毁管理器
      // api没有destroy方法
      store.destroy();
      // model没有destroy方法
    },
  };
};

// 导入存储类型
import { StoreType } from '../store/DataStoreManager';
