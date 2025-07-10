/**
 * 手动集成测试脚本
 * 用于验证各个功能模块之间的集成和交互
 */

import { timerStyleService } from '../../services/timerStyle';
import { soundService } from '../../services/sound';
import { DEFAULT_TIMER_STYLES } from '../../types/timerStyle';

// 简单的测试框架
class SimpleTestRunner {
  private tests: Array<{ name: string; fn: () => void | Promise<void> }> = [];
  private results: Array<{ name: string; passed: boolean; error?: string }> = [];

  test(name: string, fn: () => void | Promise<void>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🚀 开始运行集成测试...\n');
    
    for (const test of this.tests) {
      try {
        await test.fn();
        this.results.push({ name: test.name, passed: true });
        console.log(`✅ ${test.name}`);
      } catch (error) {
        this.results.push({ 
          name: test.name, 
          passed: false, 
          error: error instanceof Error ? error.message : String(error)
        });
        console.log(`❌ ${test.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.printSummary();
  }

  private printSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log('\n📊 测试结果汇总:');
    console.log(`通过: ${passed}/${total}`);
    console.log(`失败: ${total - passed}/${total}`);
    
    if (passed === total) {
      console.log('🎉 所有测试通过！');
    } else {
      console.log('⚠️  部分测试失败，请检查上述错误信息');
    }
  }
}

// 断言函数
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `期望 ${expected}，实际 ${actual}`);
  }
}

function assertNotNull<T>(value: T | null | undefined, message?: string) {
  if (value == null) {
    throw new Error(message || '值不应该为null或undefined');
  }
}

// 创建测试运行器
const testRunner = new SimpleTestRunner();

// 计时器样式服务集成测试
testRunner.test('计时器样式服务基本功能', () => {
  // 测试获取默认样式
  const currentStyle = timerStyleService.getCurrentStyle();
  assertNotNull(currentStyle, '应该有当前样式');
  assertEqual(currentStyle.id, 'digital-modern', '默认样式应该是digital-modern');

  // 测试切换样式
  const success = timerStyleService.setCurrentStyle('analog-classic');
  assert(success, '应该能成功切换样式');
  
  const newStyle = timerStyleService.getCurrentStyle();
  assertEqual(newStyle.id, 'analog-classic', '样式应该已切换');
});

testRunner.test('自定义样式管理', () => {
  const customStyle = {
    ...DEFAULT_TIMER_STYLES[0],
    id: 'test-integration',
    name: '集成测试样式',
    isPreset: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 添加自定义样式
  const addSuccess = timerStyleService.addCustomStyle(customStyle);
  assert(addSuccess, '应该能添加自定义样式');

  // 验证样式已添加
  const customStyles = timerStyleService.getCustomStyles();
  const found = customStyles.find(s => s.id === 'test-integration');
  assertNotNull(found, '自定义样式应该在列表中');
  assertEqual(found!.name, '集成测试样式', '样式名称应该正确');

  // 删除自定义样式
  const removeSuccess = timerStyleService.removeCustomStyle('test-integration');
  assert(removeSuccess, '应该能删除自定义样式');

  // 验证样式已删除
  const updatedStyles = timerStyleService.getCustomStyles();
  const notFound = updatedStyles.find(s => s.id === 'test-integration');
  assert(!notFound, '样式应该已被删除');
});

testRunner.test('样式状态映射', () => {
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
  assertEqual(focusStyle.id, 'digital-modern', 'focus状态样式应该正确');

  const breakStyle = timerStyleService.getStyleForState('break');
  assertEqual(breakStyle.id, 'analog-classic', 'break状态样式应该正确');

  // 禁用自动切换
  timerStyleService.setAutoSwitchByState(false);
  timerStyleService.setCurrentStyle('digital-modern');
  
  const style = timerStyleService.getStyleForState('break');
  assertEqual(style.id, 'digital-modern', '禁用自动切换时应该返回当前样式');
});

testRunner.test('样式预览功能', () => {
  // 设置初始样式
  timerStyleService.setCurrentStyle('digital-modern');
  
  // 进入预览模式
  const previewSuccess = timerStyleService.previewStyle('analog-classic');
  assert(previewSuccess, '应该能进入预览模式');
  assert(timerStyleService.isInPreviewMode(), '应该处于预览模式');
  
  const previewStyle = timerStyleService.getPreviewStyle();
  assertNotNull(previewStyle, '应该有预览样式');
  assertEqual(previewStyle!.id, 'analog-classic', '预览样式应该正确');

  // 退出预览模式
  timerStyleService.exitPreview();
  assert(!timerStyleService.isInPreviewMode(), '应该已退出预览模式');
  assert(!timerStyleService.getPreviewStyle(), '预览样式应该为null');
  
  // 当前样式应该恢复
  const currentStyle = timerStyleService.getCurrentStyle();
  assertEqual(currentStyle.id, 'digital-modern', '当前样式应该恢复');
});

testRunner.test('样式导入导出', () => {
  const originalStyle = DEFAULT_TIMER_STYLES[0];
  
  // 导出样式
  const exported = timerStyleService.exportStyle(originalStyle.id);
  assertNotNull(exported, '应该能导出样式');
  
  const exportedData = JSON.parse(exported!);
  assertEqual(exportedData.id, originalStyle.id, '导出的ID应该正确');
  assertEqual(exportedData.name, originalStyle.name, '导出的名称应该正确');
  assert(exportedData.version, '应该有版本信息');
  assert(exportedData.exportDate, '应该有导出日期');

  // 修改并导入样式
  exportedData.id = 'imported-integration-test';
  exportedData.name = '导入集成测试样式';
  
  const imported = timerStyleService.importStyle(JSON.stringify(exportedData));
  assertNotNull(imported, '应该能导入样式');
  assertEqual(imported!.id, 'imported-integration-test', '导入的ID应该正确');
  assertEqual(imported!.name, '导入集成测试样式', '导入的名称应该正确');
  
  // 清理
  timerStyleService.removeCustomStyle('imported-integration-test');
});

testRunner.test('音效服务基本功能', () => {
  // 测试音效服务初始化
  assert(soundService, '音效服务应该存在');
  
  // 测试音量设置
  soundService.setVolume(0.5);
  assertEqual(soundService.getVolume(), 0.5, '音量应该设置正确');
  
  // 测试静音
  soundService.setMuted(true);
  assert(soundService.isMuted(), '应该处于静音状态');
  
  soundService.setMuted(false);
  assert(!soundService.isMuted(), '应该已取消静音');
});

testRunner.test('样式与音效集成', () => {
  // 这个测试验证样式切换不会影响音效设置
  const originalVolume = soundService.getVolume();
  const originalMuted = soundService.isMuted();
  
  // 切换样式
  timerStyleService.setCurrentStyle('analog-classic');
  timerStyleService.setCurrentStyle('digital-modern');
  
  // 音效设置应该保持不变
  assertEqual(soundService.getVolume(), originalVolume, '音量应该保持不变');
  assertEqual(soundService.isMuted(), originalMuted, '静音状态应该保持不变');
});

testRunner.test('性能测试', () => {
  const start = performance.now();
  
  // 执行一系列操作
  for (let i = 0; i < 50; i++) {
    timerStyleService.setCurrentStyle('digital-modern');
    timerStyleService.setCurrentStyle('analog-classic');
    timerStyleService.getAllStyles();
    timerStyleService.getCustomStyles();
  }
  
  const end = performance.now();
  const duration = end - start;
  
  // 50次操作应该在合理时间内完成
  assert(duration < 500, `性能测试失败：${duration}ms 超过了 500ms 的限制`);
});

testRunner.test('错误处理', () => {
  // 测试无效样式ID
  const invalidResult = timerStyleService.setCurrentStyle('non-existent-style');
  assert(!invalidResult, '设置无效样式应该返回false');
  
  // 测试无效导入数据
  const invalidImport = timerStyleService.importStyle('invalid json');
  assert(!invalidImport, '导入无效数据应该返回null');
  
  // 测试删除不存在的样式
  const invalidRemove = timerStyleService.removeCustomStyle('non-existent');
  assert(!invalidRemove, '删除不存在的样式应该返回false');
});

// 运行测试
export async function runIntegrationTests() {
  await testRunner.run();
}

// 如果直接运行此文件
if (typeof window !== 'undefined') {
  // 在浏览器环境中，将测试函数暴露到全局
  (window as any).runIntegrationTests = runIntegrationTests;
  console.log('集成测试已准备就绪。在浏览器控制台中运行 runIntegrationTests() 来执行测试。');
}
