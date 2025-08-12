/**
 * 设备性能优化器
 * 根据设备性能自动调整应用设置以确保流畅体验
 */

interface DeviceCapabilities {
  cpu: 'low' | 'medium' | 'high';
  memory: 'low' | 'medium' | 'high';
  gpu: 'low' | 'medium' | 'high';
  battery: 'low' | 'medium' | 'high';
  network: 'slow' | 'medium' | 'fast';
}

interface PerformanceProfile {
  name: string;
  description: string;
  settings: {
    enableAnimations: boolean;
    enableBackgroundEffects: boolean;
    particleCount: number;
    animationDuration: number;
    updateFrequency: number;
    enableBlur: boolean;
    enableShadows: boolean;
    enableGradients: boolean;
    maxFPS: number;
  };
}

class DevicePerformanceOptimizer {
  private currentProfile: PerformanceProfile;
  private deviceCapabilities: DeviceCapabilities;
  private performanceHistory: number[] = [];
  private isMonitoring = false;
  private monitoringInterval: number | null = null;

  // 预定义的性能配置文件
  private readonly profiles: Record<string, PerformanceProfile> = {
    high: {
      name: 'High Performance',
      description: '高性能设备，启用所有视觉效果',
      settings: {
        enableAnimations: true,
        enableBackgroundEffects: true,
        particleCount: 100,
        animationDuration: 300,
        updateFrequency: 60,
        enableBlur: true,
        enableShadows: true,
        enableGradients: true,
        maxFPS: 60
      }
    },
    medium: {
      name: 'Balanced',
      description: '平衡性能和视觉效果',
      settings: {
        enableAnimations: true,
        enableBackgroundEffects: true,
        particleCount: 50,
        animationDuration: 200,
        updateFrequency: 30,
        enableBlur: true,
        enableShadows: false,
        enableGradients: true,
        maxFPS: 30
      }
    },
    low: {
      name: 'Performance Mode',
      description: '性能优先，最小化视觉效果',
      settings: {
        enableAnimations: false,
        enableBackgroundEffects: false,
        particleCount: 0,
        animationDuration: 100,
        updateFrequency: 15,
        enableBlur: false,
        enableShadows: false,
        enableGradients: false,
        maxFPS: 30
      }
    },
    battery: {
      name: 'Battery Saver',
      description: '省电模式，极简视觉效果',
      settings: {
        enableAnimations: false,
        enableBackgroundEffects: false,
        particleCount: 0,
        animationDuration: 0,
        updateFrequency: 10,
        enableBlur: false,
        enableShadows: false,
        enableGradients: false,
        maxFPS: 15
      }
    }
  };

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.currentProfile = this.selectOptimalProfile();
  }

  /**
   * 获取当前性能配置
   */
  getCurrentProfile(): PerformanceProfile {
    return this.currentProfile;
  }

  /**
   * 手动设置性能配置文件
   */
  setProfile(profileName: keyof typeof this.profiles): void {
    if (this.profiles[profileName]) {
      this.currentProfile = this.profiles[profileName];
      this.notifyProfileChange();
    }
  }

  /**
   * 开始性能监控和自动优化
   */
  startAutoOptimization(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(() => {
      this.checkPerformanceAndOptimize();
    }, 5000); // 每5秒检查一次
  }

  /**
   * 停止自动优化
   */
  stopAutoOptimization(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * 记录性能指标
   */
  recordPerformance(fps: number): void {
    this.performanceHistory.push(fps);
    
    // 只保留最近20个记录
    if (this.performanceHistory.length > 20) {
      this.performanceHistory.shift();
    }
  }

  /**
   * 获取设备能力评估
   */
  getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  /**
   * 获取性能建议
   */
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const avgFPS = this.getAverageFPS();

    if (avgFPS < 30) {
      recommendations.push('建议切换到性能模式以提高流畅度');
      recommendations.push('关闭背景效果和动画');
      recommendations.push('减少粒子数量');
    } else if (avgFPS < 45) {
      recommendations.push('建议使用平衡模式');
      recommendations.push('适当减少视觉效果');
    } else if (avgFPS > 55 && this.currentProfile.name === 'Performance Mode') {
      recommendations.push('设备性能良好，可以启用更多视觉效果');
      recommendations.push('考虑切换到平衡模式或高性能模式');
    }

    if (this.deviceCapabilities.battery === 'low') {
      recommendations.push('检测到低电量，建议启用省电模式');
    }

    if (this.deviceCapabilities.memory === 'low') {
      recommendations.push('内存较低，建议减少缓存和后台效果');
    }

    return recommendations;
  }

  /**
   * 检测设备能力
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const capabilities: DeviceCapabilities = {
      cpu: 'medium',
      memory: 'medium',
      gpu: 'medium',
      battery: 'high',
      network: 'medium'
    };

    // 检测CPU性能（基于硬件并发数）
    if (navigator.hardwareConcurrency) {
      if (navigator.hardwareConcurrency >= 8) {
        capabilities.cpu = 'high';
      } else if (navigator.hardwareConcurrency <= 2) {
        capabilities.cpu = 'low';
      }
    }

    // 检测内存（如果可用）
    if ('memory' in navigator) {
      const memory = (navigator as any).memory;
      if (memory.jsHeapSizeLimit) {
        const memoryGB = memory.jsHeapSizeLimit / (1024 * 1024 * 1024);
        if (memoryGB >= 4) {
          capabilities.memory = 'high';
        } else if (memoryGB <= 1) {
          capabilities.memory = 'low';
        }
      }
    }

    // 检测GPU性能（基于WebGL支持）
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && gl instanceof WebGLRenderingContext) {
      try {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (typeof renderer === 'string') {
            if (renderer.includes('Intel') || renderer.includes('integrated')) {
              capabilities.gpu = 'low';
            } else if (renderer.includes('NVIDIA') || renderer.includes('AMD') || renderer.includes('Radeon')) {
              capabilities.gpu = 'high';
            }
          }
        }
      } catch (error) {
        // WebGL 信息获取失败，设置为低性能
        capabilities.gpu = 'low';
      }
    } else {
      capabilities.gpu = 'low';
    }

    // 检测电池状态（如果可用）
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2) {
          capabilities.battery = 'low';
        } else if (battery.level > 0.8) {
          capabilities.battery = 'high';
        }
      }).catch(() => {
        // 忽略错误，使用默认值
      });
    }

    // 检测网络速度（基于连接类型）
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.effectiveType) {
        switch (connection.effectiveType) {
          case 'slow-2g':
          case '2g':
            capabilities.network = 'slow';
            break;
          case '3g':
            capabilities.network = 'medium';
            break;
          case '4g':
            capabilities.network = 'fast';
            break;
        }
      }
    }

    return capabilities;
  }

  /**
   * 选择最优性能配置文件
   */
  private selectOptimalProfile(): PerformanceProfile {
    const { cpu, memory, gpu, battery } = this.deviceCapabilities;

    // 如果电池电量低，优先省电模式
    if (battery === 'low') {
      return this.profiles.battery;
    }

    // 如果CPU、内存或GPU性能低，使用性能模式
    if (cpu === 'low' || memory === 'low' || gpu === 'low') {
      return this.profiles.low;
    }

    // 如果所有硬件都是高性能，使用高性能模式
    if (cpu === 'high' && memory === 'high' && gpu === 'high') {
      return this.profiles.high;
    }

    // 默认使用平衡模式
    return this.profiles.medium;
  }

  /**
   * 检查性能并自动优化
   */
  private checkPerformanceAndOptimize(): void {
    const avgFPS = this.getAverageFPS();
    
    if (avgFPS < 25 && this.currentProfile.name !== 'Performance Mode' && this.currentProfile.name !== 'Battery Saver') {
      // 性能不佳，降级到性能模式
      this.setProfile('low');
      console.log('Performance degraded, switching to Performance Mode');
    } else if (avgFPS > 55 && this.currentProfile.name === 'Performance Mode') {
      // 性能良好，可以升级到平衡模式
      this.setProfile('medium');
      console.log('Performance improved, switching to Balanced mode');
    }

    // 重新检测电池状态
    this.deviceCapabilities = this.detectDeviceCapabilities();
    if (this.deviceCapabilities.battery === 'low' && this.currentProfile.name !== 'Battery Saver') {
      this.setProfile('battery');
      console.log('Low battery detected, switching to Battery Saver mode');
    }
  }

  /**
   * 获取平均FPS
   */
  private getAverageFPS(): number {
    if (this.performanceHistory.length === 0) return 60; // 默认假设60fps
    
    return this.performanceHistory.reduce((sum, fps) => sum + fps, 0) / this.performanceHistory.length;
  }

  /**
   * 通知配置文件变化
   */
  private notifyProfileChange(): void {
    // 触发自定义事件，让其他组件知道配置已更改
    window.dispatchEvent(new CustomEvent('performanceProfileChanged', {
      detail: this.currentProfile
    }));
  }
}

// 创建全局设备性能优化器实例
export const devicePerformanceOptimizer = new DevicePerformanceOptimizer();

// 自动启动性能监控（在生产环境中）
if (process.env.NODE_ENV === 'production') {
  devicePerformanceOptimizer.startAutoOptimization();
}

export default devicePerformanceOptimizer;
