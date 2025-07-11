/**
 * 音频系统诊断工具
 * 用于测试和诊断音频加载问题
 */

export interface AudioTestResult {
  file: string;
  success: boolean;
  error?: string;
  duration?: number;
  format?: string;
}

/**
 * 测试单个音频文件
 */
export function testAudioFile(url: string): Promise<AudioTestResult> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const result: AudioTestResult = {
      file: url,
      success: false
    };

    // 设置超时
    const timeout = setTimeout(() => {
      result.error = 'Timeout: Audio loading took too long';
      resolve(result);
    }, 5000);

    audio.onloadedmetadata = () => {
      clearTimeout(timeout);
      result.success = true;
      result.duration = audio.duration;
      result.format = audio.src.split('.').pop() || 'unknown';
      resolve(result);
    };

    audio.onerror = (error) => {
      clearTimeout(timeout);
      result.error = `Audio loading error: ${error}`;
      resolve(result);
    };

    audio.onabort = () => {
      clearTimeout(timeout);
      result.error = 'Audio loading aborted';
      resolve(result);
    };

    // 尝试加载音频
    try {
      audio.src = url;
      audio.load();
    } catch (error) {
      clearTimeout(timeout);
      result.error = `Failed to set audio source: ${error}`;
      resolve(result);
    }
  });
}

/**
 * 测试所有默认音频文件
 */
export async function testAllAudioFiles(): Promise<AudioTestResult[]> {
  const audioFiles = [
    '/sounds/notification.mp3',
    '/sounds/micro-break.mp3',
    '/sounds/focus-start.mp3',
    '/sounds/break-start.mp3',
    '/sounds/white-noise.mp3'
  ];

  const results: AudioTestResult[] = [];
  
  for (const file of audioFiles) {
    try {
      const result = await testAudioFile(file);
      results.push(result);
    } catch (error) {
      results.push({
        file,
        success: false,
        error: `Test failed: ${error}`
      });
    }
  }

  return results;
}

/**
 * 生成音频诊断报告
 */
export function generateAudioReport(results: AudioTestResult[]): string {
  let report = '🔊 音频系统诊断报告\n';
  report += '=' .repeat(50) + '\n\n';

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  report += `📊 总体状态: ${successful.length}/${results.length} 文件加载成功\n\n`;

  if (successful.length > 0) {
    report += '✅ 成功加载的文件:\n';
    successful.forEach(result => {
      report += `  • ${result.file} (${result.duration?.toFixed(2)}s, ${result.format})\n`;
    });
    report += '\n';
  }

  if (failed.length > 0) {
    report += '❌ 加载失败的文件:\n';
    failed.forEach(result => {
      report += `  • ${result.file}\n`;
      report += `    错误: ${result.error}\n`;
    });
    report += '\n';
  }

  // 添加建议
  report += '💡 建议:\n';
  if (failed.length === results.length) {
    report += '  • 所有音频文件都无法加载，可能是路径或服务器配置问题\n';
    report += '  • 检查 public/sounds/ 目录是否存在音频文件\n';
    report += '  • 确认开发服务器正确提供静态文件\n';
  } else if (failed.length > 0) {
    report += '  • 部分音频文件无法加载，可能是文件损坏或格式不兼容\n';
    report += '  • 建议重新生成或替换失败的音频文件\n';
  } else {
    report += '  • 所有音频文件加载正常，问题可能在 Howler.js 配置\n';
    report += '  • 检查 Howler.js 的初始化和配置参数\n';
  }

  return report;
}

/**
 * 在控制台运行音频诊断
 */
export async function runAudioDiagnostics(): Promise<void> {
  console.log('🔍 开始音频系统诊断...');
  
  try {
    const results = await testAllAudioFiles();
    const report = generateAudioReport(results);
    
    console.log(report);
    
    // 将结果存储到 window 对象，方便调试
    (window as any).audioTestResults = results;
    console.log('💾 诊断结果已保存到 window.audioTestResults');
    
  } catch (error) {
    console.error('❌ 音频诊断失败:', error);
  }
}

/**
 * 创建简单的测试音频（用于测试音频系统是否工作）
 */
export function createTestTone(frequency: number = 440, duration: number = 0.5): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);

      oscillator.onended = () => resolve();
      
      setTimeout(() => resolve(), duration * 1000 + 100);
    } catch (error) {
      reject(error);
    }
  });
}
