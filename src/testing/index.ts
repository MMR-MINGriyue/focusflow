/**
 * 测试和文档系统索引文件
 * 统一导出所有测试和文档功能，方便使用
 */

// 测试工具
export {
  TestUtils,
  renderWithProviders,
  createMockFunction,
  createMockObject,
  createMockPromise,
  createMockResponse,
  createMockApiClient,
  createMockRouter,
  createMockStore,
  createMockModel,
  waitFor,
  waitForDelay,
  clearAllMocks,
  resetAllMocks,
  restoreAllMocks,
  useFakeTimers,
  setMockSystemTime,
  advanceTimersByTime,
  runAllTimers,
  runOnlyPendingTimers,
  type TestOptions,
} from './TestUtils';

// 文档生成器
export {
  DocumentationGenerator,
  type Document,
  type DocumentMetadata,
  type DocumentContent,
  type DocumentType,
  type DocumentationGeneratorOptions,
} from '../docs/DocumentationGenerator';

// 创建测试工具
export const createTestUtils = () => {
  return TestUtils;
};

// 创建文档生成器
export const createDocumentationGenerator = (options: DocumentationGeneratorOptions) => {
  return new DocumentationGenerator(options);
};

// 预定义测试配置
export const predefinedTestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/testing/setupTests.ts'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/testing/**',
    '!src/docs/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
};

// 预定义文档配置
export const predefinedDocumentationConfig = {
  outputDir: './docs',
  templateDir: './templates',
  generateSidebar: true,
  generateSearchIndex: true,
  generateApiReference: true,
  generateExamples: true,
  generateTypeDefinitions: true,
  customStyles: [
    './src/docs/styles/main.css',
  ],
  customScripts: [
    './src/docs/scripts/main.js',
  ],
};

// 测试辅助函数
export const testHelpers = {
  /**
   * 渲染组件并等待
   */
  renderAndWait: async (
    ui: React.ReactElement,
    options?: TestOptions,
    selector?: string,
    timeout = 5000
  ) => {
    const { renderWithProviders, waitForElement } = TestUtils;
    const result = renderWithProviders(ui, options);

    if (selector) {
      await waitForElement(selector, { timeout });
    }

    return result;
  },

  /**
   * 模拟API调用
   */
  mockApiCall: (
    apiClient: any,
    method: string,
    response: any,
    shouldReject = false,
    delay = 0
  ) => {
    const mockFn = apiClient[method] as jest.Mock;
    mockFn.mockImplementation(() => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (shouldReject) {
            reject(response);
          } else {
            resolve(response);
          }
        }, delay);
      });
    });
  },

  /**
   * 模拟路由导航
   */
  mockRouterNavigation: (
    router: any,
    path: string,
    state?: any
  ) => {
    const mockFn = router.navigateToPath as jest.Mock;
    mockFn.mockImplementation(() => {
      return Promise.resolve();
    });
    return router.navigateToPath(path, state);
  },

  /**
   * 模拟存储操作
   */
  mockStorageOperation: (
    store: any,
    method: string,
    key: string,
    value?: any
  ) => {
    const mockFn = store[method] as jest.Mock;
    mockFn.mockImplementation(() => {
      if (method === 'get') {
        return value;
      } else if (method === 'set' || method === 'delete') {
        return true;
      } else if (method === 'has') {
        return value !== undefined;
      }
      return undefined;
    });
    return store[method](key, value);
  },
};

// 文档辅助函数
export const documentationHelpers = {
  /**
   * 创建组件文档
   */
  createComponentDocument: (
    title: string,
    description: string,
    props: Array<{
      name: string;
      type: string;
      description?: string;
      required?: boolean;
      defaultValue?: any;
    }>,
    examples: Array<{
      title: string;
      code: string;
      description?: string;
    }> = []
  ) => {
    return {
      metadata: {
        id: title.toLowerCase().replace(/\s+/g, '-'),
        title,
        description,
        type: DocumentType.COMPONENT,
        tags: ['component', 'react'],
        createdAt: new Date(),
        updatedAt: new Date(),
        published: true,
      },
      content: {
        content: `# ${title}

${description}`,
        examples,
        api: props.map(prop => ({
          name: prop.name,
          description: prop.description,
          params: [{
            name: prop.name,
            type: prop.type,
            description: prop.description,
            required: prop.required,
            defaultValue: prop.defaultValue,
          }],
        })),
      },
    };
  },

  /**
   * 创建Hook文档
   */
  createHookDocument: (
    title: string,
    description: string,
    params: Array<{
      name: string;
      type: string;
      description?: string;
      required?: boolean;
      defaultValue?: any;
    }>,
    returns: {
      type: string;
      description?: string;
    },
    examples: Array<{
      title: string;
      code: string;
      description?: string;
    }> = []
  ) => {
    return {
      metadata: {
        id: title.toLowerCase().replace(/\s+/g, '-'),
        title,
        description,
        type: DocumentType.HOOK,
        tags: ['hook', 'react'],
        createdAt: new Date(),
        updatedAt: new Date(),
        published: true,
      },
      content: {
        content: `# ${title}

${description}`,
        examples,
        api: [{
          name: title,
          description,
          params,
          returns,
        }],
      },
    };
  },

  /**
   * 创建工具函数文档
   */
  createUtilDocument: (
    title: string,
    description: string,
    params: Array<{
      name: string;
      type: string;
      description?: string;
      required?: boolean;
      defaultValue?: any;
    }>,
    returns: {
      type: string;
      description?: string;
    },
    examples: Array<{
      title: string;
      code: string;
      description?: string;
    }> = []
  ) => {
    return {
      metadata: {
        id: title.toLowerCase().replace(/\s+/g, '-'),
        title,
        description,
        type: DocumentType.UTIL,
        tags: ['util', 'function'],
        createdAt: new Date(),
        updatedAt: new Date(),
        published: true,
      },
      content: {
        content: `# ${title}

${description}`,
        examples,
        api: [{
          name: title,
          description,
          params,
          returns,
        }],
      },
    };
  },

  /**
   * 创建API文档
   */
  createApiDocument: (
    title: string,
    description: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    params: Array<{
      name: string;
      type: string;
      description?: string;
      required?: boolean;
      defaultValue?: any;
      in: 'path' | 'query' | 'body' | 'header';
    }>,
    returns: {
      type: string;
      description?: string;
    },
    examples: Array<{
      title: string;
      code: string;
      description?: string;
    }> = []
  ) => {
    return {
      metadata: {
        id: title.toLowerCase().replace(/\s+/g, '-'),
        title,
        description,
        type: DocumentType.API,
        tags: ['api', 'http'],
        createdAt: new Date(),
        updatedAt: new Date(),
        published: true,
      },
      content: {
        content: `# ${title}

${description}

## 请求

\`${method} ${path}\``,
        examples,
        api: [{
          name: `${method} ${path}`,
          description,
          params,
          returns,
        }],
      },
    };
  },
};

// 测试和文档上下文
export interface TestingAndDocumentationContext {
  /**
   * 测试工具
   */
  test: typeof TestUtils;
  /**
   * 文档生成器
   */
  docs: DocumentationGenerator;
  /**
   * 测试辅助函数
   */
  testHelpers: typeof testHelpers;
  /**
   * 文档辅助函数
   */
  documentationHelpers: typeof documentationHelpers;
  /**
   * 初始化测试和文档
   */
  initialize: () => Promise<void>;
  /**
   * 销毁测试和文档
   */
  destroy: () => void;
}

// 创建测试和文档上下文
export const createTestingAndDocumentationContext = (): TestingAndDocumentationContext => {
  const test = TestUtils;
  const docs = createDocumentationGenerator(predefinedDocumentationConfig);

  return {
    test,
    docs,
    testHelpers,
    documentationHelpers,
    initialize: async () => {
      // 初始化测试和文档
      console.log('Initializing testing and documentation...');

      // 这里可以添加其他初始化逻辑
    },
    destroy: () => {
      // 销毁测试和文档
      console.log('Destroying testing and documentation...');

      // 这里可以添加其他销毁逻辑
    },
  };
};

// 导入文档类型
import { DocumentType } from '../docs/DocumentationGenerator';
