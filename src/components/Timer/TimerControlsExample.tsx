import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TimerControls, {
  FloatingTimerControls,
  CompactTimerControls,
  MinimalTimerControls,
  TouchFriendlyTimerControls,
  KeyboardFriendlyTimerControls
} from './TimerControls';

/**
 * TimerControls组件使用示例
 * 展示各种配置和变体的使用方法
 */
const TimerControlsExample: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [currentVariant, setCurrentVariant] = useState<'default' | 'compact' | 'minimal' | 'floating'>('default');
  const [currentSize, setCurrentSize] = useState<'small' | 'medium' | 'large'>('medium');

  // 模拟计时器操作
  const handleStart = () => {
    console.log('开始计时器');
    setLoading(true);
    setTimeout(() => {
      setIsActive(true);
      setLoading(false);
    }, 500);
  };

  const handlePause = () => {
    console.log('暂停计时器');
    setIsActive(false);
  };

  const handleReset = () => {
    console.log('重置计时器');
    setLoading(true);
    setTimeout(() => {
      setIsActive(false);
      setLoading(false);
    }, 300);
  };

  const handleSkip = () => {
    console.log('跳过当前阶段');
    setIsActive(false);
  };

  const handleStop = () => {
    console.log('停止计时器');
    setIsActive(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            TimerControls 组件示例
          </h1>
          <p className="text-gray-600">
            展示优化后的计时器控制按钮组件的各种功能和配置
          </p>
        </motion.div>

        {/* 控制面板 */}\n        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-semibold mb-4">控制面板</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 状态控制 */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">状态控制</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={disabled}
                    onChange={(e) => setDisabled(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">禁用状态</span>
                </label>
                <div className="text-sm text-gray-600">
                  当前状态: {isActive ? '运行中' : '已停止'}
                  {loading && ' (加载中...)'}
                </div>
              </div>
            </div>

            {/* 变体选择 */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">变体选择</h3>
              <select
                value={currentVariant}
                onChange={(e) => setCurrentVariant(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="default">默认</option>
                <option value="compact">紧凑</option>
                <option value="minimal">极简</option>
                <option value="floating">浮动</option>
              </select>
            </div>

            {/* 尺寸选择 */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">尺寸选择</h3>
              <select
                value={currentSize}
                onChange={(e) => setCurrentSize(e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* 主要示例 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-8"
        >
          <h2 className="text-xl font-semibold mb-6 text-center">主要示例</h2>
          <div className="flex justify-center">
            <TimerControls
              isActive={isActive}
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
              onSkip={handleSkip}
              onStop={handleStop}
              variant={currentVariant}
              size={currentSize}
              disabled={disabled}
              loading={loading}
              keyboardShortcuts={true}
              showKeyboardHelp={true}
              touchFriendly={true}
            />
          </div>
        </motion.div>

        {/* 变体展示 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 默认变体 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h3 className="text-lg font-semibold mb-4">默认变体</h3>
            <div className="flex justify-center">
              <TimerControls
                isActive={isActive}
                onStart={handleStart}
                onPause={handlePause}
                onReset={handleReset}
                onSkip={handleSkip}
                disabled={disabled}
                loading={loading}
              />
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              标准的计时器控制按钮，包含所有功能
            </p>
          </motion.div>

          {/* 紧凑变体 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h3 className="text-lg font-semibold mb-4">紧凑变体</h3>
            <div className="flex justify-center">
              <CompactTimerControls
                isActive={isActive}
                onStart={handleStart}
                onPause={handlePause}
                onReset={handleReset}
                onSkip={handleSkip}
                disabled={disabled}
                loading={loading}
              />
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              紧凑布局，适合空间有限的场景
            </p>
          </motion.div>

          {/* 极简变体 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h3 className="text-lg font-semibold mb-4">极简变体</h3>
            <div className="flex justify-center">
              <MinimalTimerControls
                isActive={isActive}
                onStart={handleStart}
                onPause={handlePause}
                onReset={handleReset}
                disabled={disabled}
                loading={loading}
              />
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              只显示图标，最小化的界面
            </p>
          </motion.div>

          {/* 触摸友好变体 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h3 className="text-lg font-semibold mb-4">触摸友好变体</h3>
            <div className="flex justify-center">
              <TouchFriendlyTimerControls
                isActive={isActive}
                onStart={handleStart}
                onPause={handlePause}
                onReset={handleReset}
                onSkip={handleSkip}
                disabled={disabled}
                loading={loading}
              />
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              大按钮，专为移动设备优化
            </p>
          </motion.div>
        </div>

        {/* 键盘友好示例 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold mb-4">键盘友好变体</h3>
          <div className="flex justify-center mb-4">
            <KeyboardFriendlyTimerControls
              isActive={isActive}
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
              onSkip={handleSkip}
              onStop={handleStop}
              disabled={disabled}
              loading={loading}
            />
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">键盘快捷键:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">空格</kbd>
                <span>开始/暂停</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">R</kbd>
                <span>重置</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">S</kbd>
                <span>跳过</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Esc</kbd>
                <span>停止</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 功能特性 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold mb-4">功能特性</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm">⌨️</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">键盘快捷键</h4>
                <p className="text-sm text-gray-600">支持全局键盘快捷键操作</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-sm">📱</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">触摸友好</h4>
                <p className="text-sm text-gray-600">优化的触摸目标大小</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 text-sm">♿</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">无障碍访问</h4>
                <p className="text-sm text-gray-600">完整的ARIA标签和屏幕阅读器支持</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 text-sm">🎨</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">多种变体</h4>
                <p className="text-sm text-gray-600">适应不同使用场景的变体</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 text-sm">⚡</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">高性能</h4>
                <p className="text-sm text-gray-600">React.memo优化，减少重渲染</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-yellow-600 text-sm">🔧</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">高度可配置</h4>
                <p className="text-sm text-gray-600">丰富的配置选项和自定义能力</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 浮动控制按钮示例 */}
        <FloatingTimerControls
          isActive={isActive}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          onSkip={handleSkip}
          disabled={disabled}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default TimerControlsExample;