/**
 * 加密安全的随机数生成服务
 * 使用 Web Crypto API 生成真随机数，避免伪随机数的可预测性
 */

class CryptoService {
  /**
   * 生成指定范围内的随机整数
   * @param min 最小值（包含）
   * @param max 最大值（包含）
   * @returns 随机整数
   */
  generateRandomInt(min: number, max: number): number {
    if (min > max) {
      throw new Error('Min value cannot be greater than max value');
    }
    
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValidValue = Math.floor(256 ** bytesNeeded / range) * range - 1;
    
    let randomValue: number;
    do {
      const randomBytes = new Uint8Array(bytesNeeded);
      crypto.getRandomValues(randomBytes);
      
      randomValue = 0;
      for (let i = 0; i < bytesNeeded; i++) {
        randomValue = randomValue * 256 + randomBytes[i];
      }
    } while (randomValue > maxValidValue);
    
    return min + (randomValue % range);
  }

  /**
   * 生成 0-1 之间的随机浮点数
   * @returns 0-1 之间的随机浮点数
   */
  generateRandomFloat(): number {
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    
    // 将字节转换为 32 位无符号整数
    const randomInt = (randomBytes[0] << 24) | 
                     (randomBytes[1] << 16) | 
                     (randomBytes[2] << 8) | 
                     randomBytes[3];
    
    // 转换为 0-1 之间的浮点数
    return randomInt / (2 ** 32);
  }

  /**
   * 生成指定范围内的随机浮点数
   * @param min 最小值
   * @param max 最大值
   * @returns 随机浮点数
   */
  generateRandomFloatRange(min: number, max: number): number {
    if (min > max) {
      throw new Error('Min value cannot be greater than max value');
    }
    
    return min + this.generateRandomFloat() * (max - min);
  }

  /**
   * 基于变比率强化机制生成微休息间隔
   * 使用指数分布来避免规律性
   * @param minInterval 最小间隔（分钟）
   * @param maxInterval 最大间隔（分钟）
   * @param lambda 指数分布参数，控制分布形状
   * @returns 下次微休息的间隔时间（秒）
   */
  generateMicroBreakInterval(
    minInterval: number = 10, 
    maxInterval: number = 30, 
    lambda: number = 0.1
  ): number {
    // 使用指数分布生成随机间隔
    const u = this.generateRandomFloat();
    const exponentialValue = -Math.log(1 - u) / lambda;
    
    // 将指数分布值映射到指定范围
    const normalizedValue = Math.min(exponentialValue / 5, 1); // 归一化到 0-1
    const intervalMinutes = minInterval + normalizedValue * (maxInterval - minInterval);
    
    // 添加一些随机扰动以进一步避免规律性
    const jitter = this.generateRandomFloatRange(-0.1, 0.1);
    const finalInterval = Math.max(minInterval, Math.min(maxInterval, intervalMinutes + jitter));
    
    return Math.round(finalInterval * 60); // 转换为秒
  }

  /**
   * 生成微休息持续时间
   * 在指定范围内随机选择，但偏向较短时间
   * @param minDuration 最小持续时间（分钟）
   * @param maxDuration 最大持续时间（分钟）
   * @returns 微休息持续时间（秒）
   */
  generateMicroBreakDuration(minDuration: number = 3, maxDuration: number = 5): number {
    // 使用 beta 分布的近似，偏向较小值
    const alpha = 2;
    const beta = 5;
    
    // 简化的 beta 分布近似
    let sum = 0;
    for (let i = 0; i < alpha + beta; i++) {
      sum += this.generateRandomFloat();
    }
    const betaValue = sum / (alpha + beta);
    
    // 进一步偏向较小值
    const skewedValue = Math.pow(betaValue, 1.5);
    
    const durationMinutes = minDuration + skewedValue * (maxDuration - minDuration);
    return Math.round(durationMinutes * 60); // 转换为秒
  }

  /**
   * 检查是否应该触发微休息
   * 基于当前专注时间和历史模式
   * @param currentFocusTime 当前专注时间（秒）
   * @param lastMicroBreakTime 上次微休息时间（秒）
   * @param nextScheduledInterval 下次计划的间隔（秒）
   * @returns 是否应该触发微休息
   */
  shouldTriggerMicroBreak(
    currentFocusTime: number,
    lastMicroBreakTime: number,
    nextScheduledInterval: number
  ): boolean {
    const timeSinceLastBreak = currentFocusTime - lastMicroBreakTime;
    
    // 基本条件：达到计划间隔
    if (timeSinceLastBreak >= nextScheduledInterval) {
      return true;
    }
    
    // 高级条件：基于概率的早期触发
    // 随着时间接近计划间隔，触发概率逐渐增加
    const progress = timeSinceLastBreak / nextScheduledInterval;
    if (progress > 0.8) { // 超过 80% 时间后开始有概率触发
      const triggerProbability = Math.pow(progress - 0.8, 2) * 0.1; // 最大 2% 概率
      return this.generateRandomFloat() < triggerProbability;
    }
    
    return false;
  }
}

export const cryptoService = new CryptoService();
