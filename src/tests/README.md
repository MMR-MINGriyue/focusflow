# FocusFlow 测试指南

## 概述

本指南提供了 FocusFlow 项目的测试标准、模板和最佳实践。我们采用 AAA 模式（Arrange-Act-Assert）和全面的测试策略来确保代码质量。

## 测试目标

- **语句覆盖率**: 80%
- **函数覆盖率**: 80%
- **行覆盖率**: 80%
- **分支覆盖率**: 70%

## 测试结构

```
src/
├── tests/
│   ├── templates/           # 测试模板
│   │   ├── ComponentTestTemplate.tsx
│   │   ├── HookTestTemplate.ts
│   │   └── ServiceTestTemplate.ts
│   ├── utils/              # 测试工具
│   │   └── testUtils.ts
│   ├── setup.ts            # 测试环境配置
│   └── README.md           # 本文档
├── components/
│   └── ComponentName/
│       ├── ComponentName.tsx
│       └── __tests__/
│           └── ComponentName.test.tsx
├── hooks/
│   └── __tests__/
│       └── useHookName.test.ts
└── services/
    └── __tests__/
        └── serviceName.test.ts
```

## 测试模板使用

### 1. 组件测试模板

```bash
# 复制模板
cp src/tests/templates/ComponentTestTemplate.tsx src/components/YourComponent/__tests__/YourComponent.test.tsx

# 替换占位符
# - ComponentName → YourComponent
# - 更新导入路径
# - 添加具体的测试用例
```

**模板包含的测试类别**：
- 基础渲染测试
- 用户交互测试
- 状态管理测试
- Props 验证测试
- 错误处理测试
- 可访问性测试
- 性能测试
- 集成测试

### 2. Hook 测试模板

```bash
# 复制模板
cp src/tests/templates/HookTestTemplate.ts src/hooks/__tests__/useYourHook.test.ts

# 替换占位符
# - useHookName → useYourHook
# - 更新依赖 mock
# - 添加具体的测试场景
```

**模板包含的测试类别**：
- 初始化测试
- 状态管理测试
- 错误处理测试
- 副作用测试
- 性能测试
- 集成测试
- 边界情况测试

### 3. 服务测试模板

```bash
# 复制模板
cp src/tests/templates/ServiceTestTemplate.ts src/services/__tests__/yourService.test.ts

# 替换占位符
# - ServiceName → YourService
# - 更新 API mock
# - 添加业务逻辑测试
```

**模板包含的测试类别**：
- 初始化测试
- CRUD 操作测试
- 错误处理测试
- 数据验证测试
- 缓存测试
- 事件处理测试
- 持久化测试
- 性能测试
- 集成测试

## 测试工具使用

### 导入测试工具

```typescript
import { testUtils } from '../tests/utils/testUtils';

// 或者导入特定功能
import { 
  createTestUser, 
  renderWithDefaults, 
  generateTimerSettings 
} from '../tests/utils/testUtils';
```

### 常用工具函数

#### 1. 组件渲染

```typescript
// 基础渲染
const { user } = renderWithDefaults(<YourComponent />);

// 异步渲染
const { user } = await renderAndWait(<YourComponent />);

// 用户交互
await user.click(screen.getByRole('button'));
await user.type(screen.getByRole('textbox'), 'test input');
```

#### 2. 数据生成

```typescript
// 生成测试数据
const settings = generateTimerSettings({ focusDuration: 30 });
const style = generateTimerStyle({ name: 'Custom Style' });
const userData = generateUserData({ name: 'Test User' });

// 批量生成
const sessions = generateTestDataArray(
  (index) => generateSessionData({ id: `session-${index}` }),
  { count: 10 }
);
```

#### 3. Mock 创建

```typescript
// 创建 mock 服务
const mockAudio = createMockAudioService();
const mockNotification = createMockNotificationService();
const mockStorage = createMockLocalStorage();
```

#### 4. 计时器控制

```typescript
const timers = createMockTimers();

// 在测试中使用
timers.advanceTime(1000); // 前进 1 秒
timers.runAllTimers();    // 运行所有计时器
```

## AAA 模式示例

### 组件测试示例

```typescript
describe('TimerDisplay', () => {
  it('displays correct time format', async () => {
    // Arrange - 准备测试数据和环境
    const mockProps = {
      timeLeft: 1500, // 25 minutes
      isActive: true,
      currentState: 'focus'
    };

    // Act - 执行被测试的操作
    const { user } = renderWithDefaults(<TimerDisplay {...mockProps} />);

    // Assert - 验证结果
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText('25:00')).toHaveCorrectTimerFormat();
  });
});
```

### Hook 测试示例

```typescript
describe('useTimer', () => {
  it('starts timer correctly', async () => {
    // Arrange
    const { result } = renderHook(() => useTimer());

    // Act
    await act(async () => {
      result.current.startTimer();
    });

    // Assert
    expect(result.current.isActive).toBe(true);
    expect(result.current.currentState).toBeValidTimerState();
  });
});
```

### 服务测试示例

```typescript
describe('TimerService', () => {
  it('saves timer settings correctly', async () => {
    // Arrange
    const service = new TimerService();
    const settings = generateTimerSettings();

    // Act
    const result = await service.saveSettings(settings);

    // Assert
    expect(result).toBe(true);
    expect(service.getSettings()).toEqual(settings);
  });
});
```

## 自定义匹配器

我们提供了专门的 Jest 匹配器：

```typescript
// 检查计时器格式
expect('25:00').toHaveCorrectTimerFormat();

// 检查计时器状态
expect('focus').toBeValidTimerState();

// 检查可访问性结构
expect(buttonElement).toHaveAccessibleStructure();
```

## 测试最佳实践

### 1. 测试命名

```typescript
// ✅ 好的命名
it('displays error message when API call fails')
it('updates timer state when start button is clicked')
it('validates required fields before form submission')

// ❌ 不好的命名
it('test timer')
it('should work')
it('API test')
```

### 2. 测试组织

```typescript
describe('ComponentName', () => {
  describe('Basic Rendering', () => {
    // 基础渲染测试
  });

  describe('User Interactions', () => {
    // 用户交互测试
  });

  describe('Error Handling', () => {
    // 错误处理测试
  });
});
```

### 3. Mock 策略

```typescript
// ✅ 在文件顶部集中 mock
jest.mock('../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// ✅ 在 beforeEach 中重置 mock
beforeEach(() => {
  jest.clearAllMocks();
});

// ✅ 为每个测试配置特定的 mock 行为
it('handles API error', async () => {
  const mockApi = require('../services/api');
  mockApi.get.mockRejectedValue(new Error('API Error'));
  
  // 测试代码...
});
```

### 4. 异步测试

```typescript
// ✅ 使用 async/await
it('loads data asynchronously', async () => {
  const { user } = renderWithDefaults(<Component />);
  
  await user.click(screen.getByRole('button'));
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});

// ✅ 使用 act 包装状态更新
it('updates state correctly', async () => {
  const { result } = renderHook(() => useCustomHook());
  
  await act(async () => {
    await result.current.updateData();
  });
  
  expect(result.current.data).toBeDefined();
});
```

## 运行测试

```bash
# 运行所有测试
npm test

# 运行特定文件
npm test ComponentName.test.tsx

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监视模式
npm test -- --watch

# 调试模式
npm test -- --verbose
```

## 覆盖率报告

测试覆盖率报告生成在 `coverage/` 目录：

- `coverage/lcov-report/index.html` - HTML 格式报告
- `coverage/lcov.info` - LCOV 格式报告
- `coverage/coverage-final.json` - JSON 格式报告

## 故障排除

### 常见问题

1. **Mock 不工作**
   - 检查 mock 路径是否正确
   - 确保在 `beforeEach` 中清理 mock
   - 验证 mock 配置是否在测试文件顶部

2. **异步测试失败**
   - 使用 `waitFor` 等待异步操作
   - 确保使用 `act` 包装状态更新
   - 检查是否正确处理 Promise

3. **组件渲染错误**
   - 检查是否正确 mock 了所有依赖
   - 验证 props 类型是否正确
   - 确保测试环境配置正确

### 调试技巧

```typescript
// 打印渲染的 DOM
const { debug } = renderWithDefaults(<Component />);
debug();

// 查看特定元素
debug(screen.getByRole('button'));

// 使用 screen.logTestingPlaygroundURL() 获取选择器建议
screen.logTestingPlaygroundURL();
```

## 贡献指南

1. 为新组件/Hook/服务添加测试时，请使用相应的模板
2. 确保测试覆盖率不低于目标值
3. 遵循 AAA 模式和命名约定
4. 添加必要的注释说明复杂的测试逻辑
5. 在 PR 中包含测试覆盖率变化说明
