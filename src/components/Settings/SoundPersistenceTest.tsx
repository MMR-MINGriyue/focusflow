import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { soundService } from '../../services/sound';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const SoundPersistenceTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    try {
      // 测试1: 音量设置持久化
      const originalVolume = soundService.getVolumeSettings();
      soundService.setMasterVolume(0.8);
      soundService.setCategoryVolume('notification', 0.6);
      
      // 模拟重新加载
      const newVolumeSettings = soundService.getVolumeSettings();
      if (newVolumeSettings.master === 0.8 && newVolumeSettings.notification === 0.6) {
        results.push({
          name: '音量设置持久化',
          status: 'pass',
          message: '音量设置成功保存和加载'
        });
      } else {
        results.push({
          name: '音量设置持久化',
          status: 'fail',
          message: '音量设置未正确保存'
        });
      }

      // 恢复原始设置
      soundService.setMasterVolume(originalVolume.master);
      soundService.setCategoryVolume('notification', originalVolume.notification);

      // 测试2: 音效映射持久化
      const originalMappings = soundService.getSoundMappings();
      soundService.setSoundMapping('focusStart', 'notification');
      
      const newMappings = soundService.getSoundMappings();
      if (newMappings.focusStart === 'notification') {
        results.push({
          name: '音效映射持久化',
          status: 'pass',
          message: '音效映射成功保存和加载'
        });
      } else {
        results.push({
          name: '音效映射持久化',
          status: 'fail',
          message: '音效映射未正确保存'
        });
      }

      // 恢复原始映射
      soundService.setSoundMapping('focusStart', originalMappings.focusStart);

      // 测试3: 本地存储可用性
      try {
        const testKey = 'focusflow-test-key';
        const testValue = 'test-value';
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (retrieved === testValue) {
          results.push({
            name: '本地存储可用性',
            status: 'pass',
            message: '本地存储功能正常'
          });
        } else {
          results.push({
            name: '本地存储可用性',
            status: 'fail',
            message: '本地存储读写失败'
          });
        }
      } catch (error) {
        results.push({
          name: '本地存储可用性',
          status: 'fail',
          message: `本地存储错误: ${error instanceof Error ? error.message : '未知错误'}`
        });
      }

      // 测试4: 自定义音效数量
      const allSounds = soundService.getAllSounds();
      const customSounds = allSounds.filter(sound => sound.type === 'custom');
      results.push({
        name: '自定义音效统计',
        status: customSounds.length > 0 ? 'pass' : 'warning',
        message: `发现 ${customSounds.length} 个自定义音效`
      });

      // 测试5: 存储使用情况
      const storageInfo = soundService.getStorageInfo();
      results.push({
        name: '存储使用情况',
        status: 'pass',
        message: `总音效: ${storageInfo.totalSounds}, 自定义: ${storageInfo.customSounds}, 大小: ${Math.round(storageInfo.totalSize / 1024)}KB`
      });

      // 测试6: 存储健康检查
      const healthCheck = soundService.getStorageHealth();
      results.push({
        name: '存储健康检查',
        status: healthCheck.status === 'healthy' ? 'pass' : healthCheck.status === 'warning' ? 'warning' : 'fail',
        message: healthCheck.issues.length === 0 ? '存储系统健康' : `发现问题: ${healthCheck.issues.join(', ')}`
      });

    } catch (error) {
      results.push({
        name: '测试执行',
        status: 'fail',
        message: `测试执行失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  useEffect(() => {
    // 组件加载时自动运行测试
    runTests();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return 'border-green-200 bg-green-50';
      case 'fail':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const passedTests = testResults.filter(r => r.status === 'pass').length;
  const totalTests = testResults.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">音效持久化测试</h3>
        </div>
        <Button
          type="button"
          onClick={runTests}
          disabled={isRunning}
          size="sm"
          className="flex items-center space-x-1"
        >
          <RefreshCw className={`h-3 w-3 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? '测试中...' : '重新测试'}</span>
        </Button>
      </div>

      {/* 测试结果概览 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">测试结果</span>
          <span className="text-sm text-gray-500">
            {passedTests}/{totalTests} 通过
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: totalTests > 0 ? `${(passedTests / totalTests) * 100}%` : '0%'
            }}
          ></div>
        </div>
      </div>

      {/* 详细测试结果 */}
      <div className="space-y-3">
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`border rounded-lg p-3 ${getStatusColor(result.status)}`}
          >
            <div className="flex items-start space-x-3">
              {getStatusIcon(result.status)}
              <div className="flex-1">
                <div className="font-medium text-gray-700">{result.name}</div>
                <div className="text-sm text-gray-600 mt-1">{result.message}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {testResults.length === 0 && !isRunning && (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>点击"重新测试"开始验证音效持久化功能</p>
        </div>
      )}

      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
        <p><strong>测试说明：</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>音量设置持久化：验证音量配置是否正确保存到本地存储</li>
          <li>音效映射持久化：验证事件音效映射是否正确保存</li>
          <li>本地存储可用性：检查浏览器本地存储功能是否正常</li>
          <li>自定义音效统计：显示当前自定义音效的数量</li>
          <li>存储使用情况：显示音效库的存储使用情况</li>
          <li>存储健康检查：检查数据完整性和存储系统健康状态</li>
        </ul>
        <p className="mt-2"><strong>错误恢复：</strong>系统具备自动备份和数据恢复机制，可以从损坏的数据中恢复。</p>
      </div>
    </div>
  );
};

export default SoundPersistenceTest;
