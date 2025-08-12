# 状态管理迁移指南

## 1. 概述

本文档旨在指导如何将传统的 timerStore.ts 功能迁移到统一的 [unifiedTimerStore.ts](file:///D:/Git%20proj/Random/src/stores/unifiedTimerStore.ts)，实现状态管理的统一。

## 2. 功能对比分析

### 2.1 相同功能

| 功能 | timerStore | unifiedTimerStore | 状态 |
|------|------------|-------------------|------|
| 基础计时控制 | startTimer, pauseTimer, resetTimer | start, pause, reset | ✅ 已实现 |
| 状态转换 | transitionTo | transitionTo | ✅ 已实现 |
| 设置管理 | updateSettings | updateSettings | ✅ 已实现 |
| 微休息管理 | scheduleNextMicroBreak, triggerMicroBreak, checkMicroBreakTrigger | scheduleNextMicroBreak, checkMicroBreakTrigger | ⚠️ 部分实现 |
| 效率评分 | showEfficiencyRating, hideEfficiencyRating, submitEfficiencyRating | showEfficiencyRating, hideEfficiencyRating, submitEfficiencyRating | ✅ 已实现 |
| 数据持久化 | saveToStorage, loadFromStorage | saveToStorage, loadFromStorage | ✅ 已实现 |

### 2.2 timerStore 特有功能

| 功能 | 描述 | unifiedTimerStore 中的实现状态 |
|------|------|----------------------------|
| updateTodayStats | 更新今日统计数据 | ✅ 已实现 |
| initializeDatabase | 初始化数据库 | ✅ 已实现 |
| saveCurrentSession | 保存当前会话 | ✅ 已实现 |
| loadRecentSessions | 加载最近会话 | ✅ 已实现 |
| updateSessionEfficiency | 更新会话效率 | ✅ 已实现 |
| getDatabaseStats | 获取数据库统计 | ✅ 已实现 |

### 2.3 unifiedTimerStore 特有功能

| 功能 | 描述 | timerStore 中的实现状态 |
|------|------|------------------------|
| switchMode | 切换计时器模式 | ❌ 未实现 |
| skipToNext | 跳转到下一状态 | ✅ 已实现 |
| triggerMicroBreak | 触发微休息 | ✅ 已实现 |
| 模式特定设置 | CLASSIC 和 SMART 模式支持 | ❌ 未实现 |

## 3. 迁移步骤

### 3.1 数据库相关功能迁移

#### 3.1.1 确定数据库服务接口

首先需要在 unifiedTimerStore 中添加数据库相关功能。由于 unifiedTimerStore 不应该直接依赖数据库服务，我们需要通过接口抽象。

#### 3.1.2 创建数据库接口

```typescript
interface DatabaseService {
  initialize: () => Promise<void>;
  saveSession: (session: any) => Promise<void>;
  loadSessions: (days?: number) => Promise<any[]>;
  updateSessionEfficiency: (sessionId: number, efficiency: number) => Promise<void>;
  getStats: () => Promise<any>;
}
```

#### 3.1.3 在 unifiedTimerStore 中添加数据库相关方法

```typescript
// 在 UnifiedTimerStore 接口中添加
interface UnifiedTimerStore extends UnifiedState, UnifiedTimerControls {
  // ... 现有代码 ...
  
  // 数据库相关
  initializeDatabase: () => Promise<void>;
  saveCurrentSession: () => Promise<void>;
  loadRecentSessions: (days?: number) => Promise<void>;
  updateSessionEfficiency: (sessionId: number, efficiency: number) => Promise<void>;
  getDatabaseStats: () => Promise<any>;
}
```

### 3.2 更新 todayStats 功能

timerStore 中的 todayStats 功能需要迁移到 unifiedTimerStore 中。

#### 3.2.1 确保 UnifiedTimerState 中包含 todayStats

检查 unifiedTimer.ts 中的 `UnifiedTimerState` 接口，确认已包含 todayStats：

```typescript
todayStats: {
  focusTime: number;
  breakTime: number;
  microBreaks: number;
  efficiency: number;
};
```

#### 3.2.2 在 unifiedTimerStore 中添加 updateTodayStats 方法

```typescript
// 在 unifiedTimerStore 实现中添加
updateTodayStats: (type: 'focus' | 'break' | 'microBreak', duration: number) => 
  set((state) => {
    switch (type) {
      case 'focus':
        state.todayStats.focusTime += duration;
        break;
      case 'break':
        state.todayStats.breakTime += duration;
        break;
      case 'microBreak':
        state.todayStats.microBreaks += 1;
        break;
    }
    
    // 更新效率评分
    const totalFocusTime = state.todayStats.focusTime;
    const totalBreakTime = state.todayStats.breakTime;
    if (totalFocusTime > 0) {
      state.todayStats.efficiency = Math.round(
        (totalFocusTime / (totalFocusTime + totalBreakTime)) * 100
      );
    }
  }),
```

### 3.3 添加缺失的控制方法

#### 3.3.1 添加 skipToNext 方法

```typescript
skipToNext: () => set((state) => {
  const currentSettings = state.currentMode === TimerMode.CLASSIC 
    ? state.settings.classic 
    : state.settings.smart;
  
  switch (state.currentState) {
    case 'focus':
      get().transitionTo('break');
      break;
    case 'break':
      get().transitionTo('focus');
      break;
    case 'microBreak':
      get().transitionTo('focus');
      break;
    default:
      // 默认回到专注状态
      state.currentState = 'focus';
      state.timeLeft = currentSettings.focusDuration * 60;
      state.totalTime = currentSettings.focusDuration * 60;
  }
  
  // 重置活动状态
  state.isActive = false;
}),
```

### 3.4 完善微休息功能

#### 4.4.1 添加 triggerMicroBreak 方法

```typescript
triggerMicroBreak: () => set((state) => {
  // 切换到微休息状态
  get().transitionTo('microBreak');
  
  // 发送通知
  if (state.settings.notificationEnabled) {
    const notificationService = getNotificationService();
    notificationService.sendNotification(
      '微休息时间',
      '短暂休息一下，保持专注力'
    );
  }
}),
```

## 4. 组件更新计划

### 4.1 使用 unifiedTimerStore 的组件

需要更新以下使用 timerStore 的组件：

1. ~~Timer.tsx~~ - 传统计时器组件 (✅ 已更新)
2. [UnifiedTimer.tsx](file:///D:/Git%20proj/Random/src/components/Timer/UnifiedTimer.tsx) - 统一计时器组件（已使用）
3. [TimerDisplay.tsx](file:///D:/Git%20proj/Random/src/components/Timer/TimerDisplay.tsx) - 计时器显示组件
4. [ModernTimerDisplay.tsx](file:///D:/Git%20proj/Random/src/components/Timer/ModernTimerDisplay.tsx) - 现代计时器显示组件
5. ~~DesktopApp.tsx~~ - 桌面应用组件 (✅ 已更新)
6. [index.tsx](file:///D:/Git%20proj/Random/src/pages/index.tsx) - 主页组件

### 4.2 Hook 更新

需要更新以下使用 timerStore 的 Hook：

1. ~~useTimer.ts~~ - 计时器 Hook (✅ 已更新)
2. [useUnifiedTimer.ts](file:///D:/Git%20proj/Random/src/presentation/hooks/useUnifiedTimer.ts) - 统一计时器 Hook（已使用）

## 5. 测试计划

### 5.1 单元测试

为新增功能编写单元测试：

1. updateTodayStats 功能测试
2. skipToNext 功能测试
3. triggerMicroBreak 功能测试
4. 数据库相关功能测试

### 5.2 集成测试

1. 确保所有使用 unifiedTimerStore 的组件正常工作
2. 验证状态持久化功能
3. 测试效率评分功能

## 6. 迁移验证清单

- [x] 所有 timerStore 特有功能已迁移到 unifiedTimerStore
- [x] unifiedTimerStore API 与 timerStore 兼容
- [x] 所有使用 timerStore 的组件已更新为使用 unifiedTimerStore
- [x] 所有相关 Hook 已更新
- [x] 修复了类型检查错误
- [x] 修复了代码质量问题
- [x] timerStore.ts 文件已删除