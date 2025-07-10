/**
 * 计时器样式系统集成测试
 * 测试计时器样式服务与组件的集成
 */

import { timerStyleService } from '../../services/timerStyle';
import { DEFAULT_TIMER_STYLES } from '../../types/timerStyle';

// 模拟localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('计时器样式系统集成测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('样式服务与存储集成', () => {
    test('应该能保存和加载样式设置', () => {
      // 设置当前样式
      timerStyleService.setCurrentStyle('analog-classic');
      
      // 验证localStorage被调用
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'focusflow-timer-style-settings',
        expect.stringContaining('analog-classic')
      );
      
      // 验证当前样式已更新
      const currentStyle = timerStyleService.getCurrentStyle();
      expect(currentStyle.id).toBe('analog-classic');
    });

    test('应该能添加自定义样式并持久化', () => {
      const customStyle = {
        ...DEFAULT_TIMER_STYLES[0],
        id: 'test-custom',
        name: '测试自定义样式',
        isPreset: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 添加自定义样式
      const success = timerStyleService.addCustomStyle(customStyle);
      expect(success).toBe(true);

      // 验证样式已添加到列表
      const customStyles = timerStyleService.getCustomStyles();
      expect(customStyles).toContainEqual(expect.objectContaining({
        id: 'test-custom',
        name: '测试自定义样式'
      }));

      // 验证数据已保存到localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('样式状态映射集成', () => {
    test('应该能根据计时器状态自动切换样式', () => {
      // 设置状态样式映射
      const stateStyles = {
        focus: 'digital-modern',
        break: 'analog-classic',
        microBreak: 'progress-minimal'
      };
      
      timerStyleService.setStateStyles(stateStyles);
      timerStyleService.setAutoSwitchByState(true);

      // 测试不同状态的样式获取
      const focusStyle = timerStyleService.getStyleForState('focus');
      expect(focusStyle.id).toBe('digital-modern');

      const breakStyle = timerStyleService.getStyleForState('break');
      expect(breakStyle.id).toBe('analog-classic');

      const microBreakStyle = timerStyleService.getStyleForState('microBreak');
      expect(microBreakStyle.id).toBe('progress-minimal');
    });

    test('应该在禁用自动切换时返回当前样式', () => {
      timerStyleService.setAutoSwitchByState(false);
      timerStyleService.setCurrentStyle('digital-modern');

      const style = timerStyleService.getStyleForState('break');
      expect(style.id).toBe('digital-modern');
    });
  });

  describe('样式预览集成', () => {
    test('应该能进入和退出预览模式', () => {
      // 设置初始样式
      timerStyleService.setCurrentStyle('digital-modern');
      
      // 进入预览模式
      const success = timerStyleService.previewStyle('analog-classic');
      expect(success).toBe(true);
      expect(timerStyleService.isInPreviewMode()).toBe(true);
      
      const previewStyle = timerStyleService.getPreviewStyle();
      expect(previewStyle?.id).toBe('analog-classic');

      // 退出预览模式
      timerStyleService.exitPreview();
      expect(timerStyleService.isInPreviewMode()).toBe(false);
      expect(timerStyleService.getPreviewStyle()).toBeNull();
      
      // 当前样式应该恢复
      const currentStyle = timerStyleService.getCurrentStyle();
      expect(currentStyle.id).toBe('digital-modern');
    });
  });

  describe('样式导入导出集成', () => {
    test('应该能导出和导入样式', () => {
      const originalStyle = DEFAULT_TIMER_STYLES[0];
      
      // 导出样式
      const exported = timerStyleService.exportStyle(originalStyle.id);
      expect(exported).toBeTruthy();
      
      const exportedData = JSON.parse(exported!);
      expect(exportedData.id).toBe(originalStyle.id);
      expect(exportedData.name).toBe(originalStyle.name);
      expect(exportedData.version).toBe('1.0');
      expect(exportedData.exportDate).toBeTruthy();

      // 修改导出的样式
      exportedData.id = 'imported-test';
      exportedData.name = '导入测试样式';
      
      // 导入样式
      const imported = timerStyleService.importStyle(JSON.stringify(exportedData));
      expect(imported).toBeTruthy();
      expect(imported?.id).toBe('imported-test');
      expect(imported?.name).toBe('导入测试样式');
      
      // 验证样式已添加到自定义样式列表
      const customStyles = timerStyleService.getCustomStyles();
      expect(customStyles.some(style => style.id === 'imported-test')).toBe(true);
    });
  });

  describe('样式监听器集成', () => {
    test('应该能注册和触发样式变化监听器', () => {
      const mockListener = jest.fn();
      
      // 注册监听器
      timerStyleService.addListener(mockListener);
      
      // 触发样式变化
      timerStyleService.setCurrentStyle('analog-classic');
      
      // 验证监听器被调用
      expect(mockListener).toHaveBeenCalled();
      
      // 移除监听器
      timerStyleService.removeListener(mockListener);
      
      // 再次触发变化，监听器不应该被调用
      mockListener.mockClear();
      timerStyleService.setCurrentStyle('digital-modern');
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('错误处理集成', () => {
    test('应该优雅处理无效的样式ID', () => {
      const success = timerStyleService.setCurrentStyle('non-existent');
      expect(success).toBe(false);
      
      // 当前样式应该保持不变
      const currentStyle = timerStyleService.getCurrentStyle();
      expect(currentStyle.id).toBe('digital-modern'); // 默认样式
    });

    test('应该优雅处理无效的导入数据', () => {
      const imported = timerStyleService.importStyle('invalid json');
      expect(imported).toBeNull();
      
      const invalidStyle = { id: 'test' }; // 缺少必要字段
      const imported2 = timerStyleService.importStyle(JSON.stringify(invalidStyle));
      expect(imported2).toBeNull();
    });

    test('应该优雅处理localStorage错误', () => {
      // 模拟localStorage错误
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // 操作应该不会抛出错误
      expect(() => {
        timerStyleService.setCurrentStyle('analog-classic');
      }).not.toThrow();
    });
  });

  describe('性能集成测试', () => {
    test('应该能处理大量样式操作', () => {
      const start = performance.now();
      
      // 执行大量操作
      for (let i = 0; i < 100; i++) {
        timerStyleService.setCurrentStyle('digital-modern');
        timerStyleService.setCurrentStyle('analog-classic');
        timerStyleService.getAllStyles();
        timerStyleService.getCustomStyles();
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // 100次操作应该在合理时间内完成
      expect(duration).toBeLessThan(1000); // 1秒内
    });

    test('应该能处理大量自定义样式', () => {
      // 添加多个自定义样式
      for (let i = 0; i < 50; i++) {
        const customStyle = {
          ...DEFAULT_TIMER_STYLES[0],
          id: `custom-${i}`,
          name: `自定义样式 ${i}`,
          isPreset: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        timerStyleService.addCustomStyle(customStyle);
      }
      
      // 验证所有样式都被正确添加
      const customStyles = timerStyleService.getCustomStyles();
      expect(customStyles.length).toBe(50);
      
      // 验证获取所有样式的性能
      const start = performance.now();
      const allStyles = timerStyleService.getAllStyles();
      const end = performance.now();
      
      expect(allStyles.length).toBeGreaterThanOrEqual(54); // 4个预设 + 50个自定义
      expect(end - start).toBeLessThan(100); // 100ms内
    });
  });

  describe('数据一致性集成测试', () => {
    test('应该保持样式数据的一致性', () => {
      // 添加自定义样式
      const customStyle = {
        ...DEFAULT_TIMER_STYLES[0],
        id: 'consistency-test',
        name: '一致性测试样式',
        isPreset: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      timerStyleService.addCustomStyle(customStyle);
      
      // 从不同方法获取样式应该返回相同的数据
      const fromGetAll = timerStyleService.getAllStyles().find(s => s.id === 'consistency-test');
      const fromGetCustom = timerStyleService.getCustomStyles().find(s => s.id === 'consistency-test');
      
      expect(fromGetAll).toEqual(fromGetCustom);
      expect(fromGetAll?.name).toBe('一致性测试样式');
      
      // 设置为当前样式
      timerStyleService.setCurrentStyle('consistency-test');
      const currentStyle = timerStyleService.getCurrentStyle();
      
      expect(currentStyle.id).toBe('consistency-test');
      expect(currentStyle.name).toBe('一致性测试样式');
    });
  });
});
