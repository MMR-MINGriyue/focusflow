// WebAssembly Timer 包装器
// 提供高性能的计时器计算功能

export enum TimerState {
  Focus = 0,
  Break = 1,
  MicroBreak = 2,
}

export interface TimerCalculation {
  time: number;
  formattedTime: string;
  progress: number;
  remaining: number;
  state: TimerState;
}

export interface WasmTimerConfig {
  duration: number;
  state: TimerState;
  enableOptimization?: boolean;
}

// WebAssembly 模块接口
declare global {
  interface Window {
    wasmTimer?: any;
  }
}

export class WasmTimer {
  private wasmModule: any = null;
  private calculator: any = null;
  private isInitialized = false;


  constructor() {
    this.initializeWasm();
  }

  private async initializeWasm() {
    try {
      // 动态导入WASM模块
      const wasm = await import('../wasm/pkg/timer_calculation');
      this.wasmModule = wasm;
      this.isInitialized = true;
      console.log('WebAssembly Timer initialized successfully');
    } catch (error) {
      console.warn('WebAssembly Timer initialization failed:', error);
      this.isInitialized = false;
    }
  }

  public async createTimer(config: WasmTimerConfig): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initializeWasm();
    }

    if (!this.wasmModule) {
      console.warn('WASM module not available, falling back to JS');
      return false;
    }

    try {
      this.calculator = new this.wasmModule.TimerCalculator(
        config.duration,
        config.state
      );
      
      // 根据配置优化更新频率
      if (config.enableOptimization) {
        const optimalInterval = this.calculator.get_optimal_update_interval();
        console.log(`Optimal update interval: ${optimalInterval}ms`);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to create WASM timer:', error);
      return false;
    }
  }

  public update(): TimerCalculation | null {
    if (!this.calculator || !this.isInitialized) {
      return null;
    }

    try {
      const result = this.calculator.update();
      return {
        time: result.time,
        formattedTime: result.formatted_time,
        progress: result.progress,
        remaining: result.remaining,
        state: result.state,
      };
    } catch (error) {
      console.error('WASM timer update failed:', error);
      return null;
    }
  }

  public reset(newDuration: number, newState: TimerState): boolean {
    if (!this.calculator || !this.isInitialized) {
      return false;
    }

    try {
      this.calculator.reset(newDuration, newState);
      return true;
    } catch (error) {
      console.error('WASM timer reset failed:', error);
      return false;
    }
  }

  public pause(): number {
    if (!this.calculator || !this.isInitialized) {
      return 0;
    }

    try {
      return this.calculator.pause();
    } catch (error) {
      console.error('WASM timer pause failed:', error);
      return 0;
    }
  }

  public resume(remainingTime: number): boolean {
    if (!this.calculator || !this.isInitialized) {
      return false;
    }

    try {
      this.calculator.resume(remainingTime);
      return true;
    } catch (error) {
      console.error('WASM timer resume failed:', error);
      return false;
    }
  }

  public shouldUpdateDisplay(lastUpdate: number): boolean {
    if (!this.calculator || !this.isInitialized) {
      return true;
    }

    try {
      return this.calculator.optimize_display_update(lastUpdate);
    } catch (error) {
      return true;
    }
  }

  public calculateFormattedTime(seconds: number): string {
    if (!this.isInitialized || !this.wasmModule) {
      return this.fallbackFormatTime(seconds);
    }

    try {
      return this.wasmModule.TimerCalculator.prototype.calculate_formatted_time.call(
        null,
        seconds
      );
    } catch (error) {
      return this.fallbackFormatTime(seconds);
    }
  }

  public calculateProgress(current: number, total: number): number {
    if (!this.isInitialized || !this.wasmModule) {
      return total === 0 ? 0 : (current / total) * 100;
    }

    try {
      return this.wasmModule.TimerCalculator.prototype.calculate_progress_percentage.call(
        null,
        current,
        total
      );
    } catch (error) {
      return total === 0 ? 0 : (current / total) * 100;
    }
  }

  public async benchmark(iterations: number = 100000): Promise<number> {
    if (!this.isInitialized || !this.wasmModule) {
      return this.fallbackBenchmark(iterations);
    }

    try {
      return this.wasmModule.benchmark_calculation(iterations);
    } catch (error) {
      return this.fallbackBenchmark(iterations);
    }
  }

  public async calculateMultipleTimers(durations: number[]): Promise<TimerCalculation[]> {
    if (!this.isInitialized || !this.wasmModule) {
      return this.fallbackCalculateMultiple(durations);
    }

    try {
      const results = this.wasmModule.calculate_multiple_timers(durations);
      return results.map((result: any) => ({
        time: result.time,
        formattedTime: result.formatted_time,
        progress: result.progress,
        remaining: result.remaining,
        state: result.state,
      }));
    } catch (error) {
      return this.fallbackCalculateMultiple(durations);
    }
  }

  public getOptimalUpdateInterval(): number {
    if (!this.calculator || !this.isInitialized) {
      return 1000;
    }

    try {
      return this.calculator.get_optimal_update_interval();
    } catch (error) {
      return 1000;
    }
  }

  public optimizeMemoryUsage(currentMemory: number): number {
    if (!this.isInitialized || !this.wasmModule) {
      return currentMemory;
    }

    try {
      return this.wasmModule.optimize_memory_usage(currentMemory);
    } catch (error) {
      return currentMemory;
    }
  }

  public getNextState(currentState: TimerState, completed: boolean): TimerState {
    if (!this.isInitialized || !this.wasmModule) {
      return this.fallbackNextState(currentState, completed);
    }

    try {
      return this.wasmModule.TimerCalculator.prototype.calculate_next_state.call(
        null,
        currentState,
        completed
      );
    } catch (error) {
      return this.fallbackNextState(currentState, completed);
    }
  }

  public isAvailable(): boolean {
    return this.isInitialized && this.wasmModule !== null;
  }

  private fallbackFormatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private fallbackBenchmark(iterations: number): number {
    const start = performance.now();
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i * 1.1);
    }
    return performance.now() - start;
  }

  private fallbackCalculateMultiple(durations: number[]): TimerCalculation[] {
    return durations.map(duration => ({
      time: duration,
      formattedTime: this.fallbackFormatTime(duration),
      progress: duration === 0 ? 0 : (duration / 3600) * 100,
      remaining: duration,
      state: TimerState.Focus,
    }));
  }

  private fallbackNextState(currentState: TimerState, completed: boolean): TimerState {
    if (!completed) return currentState;
    
    switch (currentState) {
      case TimerState.Focus:
        return TimerState.Break;
      case TimerState.Break:
        return TimerState.Focus;
      case TimerState.MicroBreak:
        return TimerState.Focus;
      default:
        return TimerState.Focus;
    }
  }
}

// 单例实例
export const wasmTimer = new WasmTimer();

// 性能监控工具
export class WasmPerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [name, values] of this.metrics.entries()) {
      if (values.length > 0) {
        result[name] = values.reduce((sum, val) => sum + val, 0) / values.length;
      }
    }
    return result;
  }

  clearMetrics() {
    this.metrics.clear();
  }
}

export const wasmPerformanceMonitor = new WasmPerformanceMonitor();