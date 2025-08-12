/**
 * 验证工具函数集合
 * 用于验证各种输入和设置数据
 */

// 导入类型定义
import { TimerSettings as TimerSettingsType } from '../types/timer.types';
// import { TimerMode } from '../types/unifiedTimer'; // 暂时注释掉未使用的导入
import { Settings } from './storageUtils';

// 定义会话数据类型，因为原类型定义中可能不存在
interface SessionData {
  id?: string;
  type?: 'focus' | 'shortBreak' | 'longBreak' | 'microBreak';
  startTime?: string;
  duration?: number;
  completed?: boolean;
  tags?: string[];
}

/**
 * 验证计时器设置
 * @param settings 计时器设置对象
 * @returns 验证结果对象，包含是否有效和错误信息
 */
export function validateTimerSettings(settings: Partial<TimerSettingsType> | Partial<Settings>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // 验证模式
  if (settings.mode && !['classic', 'smart'].includes(settings.mode)) {
    errors.mode = 'Invalid timer mode. Must be one of: classic, smart';
  }

  // 处理不同的类型定义结构
  const isTimerSettingsType = 'classic' in settings && 'smart' in settings;
  const isSettingsType = 'workDuration' in settings;

  // 验证经典模式设置
  if (settings.classic) {
    const classic = settings.classic;

    if (classic.focusDuration !== undefined) {
      if (typeof classic.focusDuration !== 'number' || classic.focusDuration <= 0 || classic.focusDuration > 60) {
        errors['classic.focusDuration'] = 'Focus duration must be a number between 1 and 60 minutes';
      }
    }

    if (classic.shortBreakDuration !== undefined) {
      if (typeof classic.shortBreakDuration !== 'number' || classic.shortBreakDuration <= 0 || classic.shortBreakDuration > 30) {
        errors['classic.shortBreakDuration'] = 'Short break duration must be a number between 1 and 30 minutes';
      }
    }

    if (classic.longBreakDuration !== undefined) {
      if (typeof classic.longBreakDuration !== 'number' || classic.longBreakDuration <= 0 || classic.longBreakDuration > 60) {
        errors['classic.longBreakDuration'] = 'Long break duration must be a number between 1 and 60 minutes';
      }
    }

    if (classic.longBreakInterval !== undefined) {
      if (typeof classic.longBreakInterval !== 'number' || classic.longBreakInterval <= 0 || classic.longBreakInterval > 10) {
        errors['classic.longBreakInterval'] = 'Long break interval must be a number between 1 and 10';
      }
    }

    if (classic.autoStartBreaks !== undefined && typeof classic.autoStartBreaks !== 'boolean') {
      errors['classic.autoStartBreaks'] = 'autoStartBreaks must be a boolean value';
    }

    if (classic.autoStartFocus !== undefined && typeof classic.autoStartFocus !== 'boolean') {
      errors['classic.autoStartFocus'] = 'autoStartFocus must be a boolean value';
    }
  }

  // 验证智能模式设置
  if (settings.smart) {
    const smart = settings.smart;

    if (smart.focusDuration !== undefined) {
      if (typeof smart.focusDuration !== 'number' || smart.focusDuration <= 0 || smart.focusDuration > 60) {
        errors['smart.focusDuration'] = 'Focus duration must be a number between 1 and 60 minutes';
      }
    }

    if (smart.breakStrategy && !['dynamic', 'fixed'].includes(smart.breakStrategy)) {
      errors['smart.breakStrategy'] = 'Break strategy must be one of: dynamic, fixed';
    }

    if (smart.difficulty && !['easy', 'medium', 'hard'].includes(smart.difficulty)) {
      errors['smart.difficulty'] = 'Difficulty must be one of: easy, medium, hard';
    }

    if (smart.autoAdjustDuration !== undefined && typeof smart.autoAdjustDuration !== 'boolean') {
      errors['smart.autoAdjustDuration'] = 'autoAdjustDuration must be a boolean value';
    }

    if (smart.goalCompletion !== undefined) {
      if (typeof smart.goalCompletion !== 'number' || smart.goalCompletion <= 0 || smart.goalCompletion > 20) {
        errors['smart.goalCompletion'] = 'Goal completion must be a number between 1 and 20';
      }
    }
  }

  // 验证通用设置
  if (settings.notifications !== undefined && typeof settings.notifications !== 'boolean') {
    errors.notifications = 'Notifications must be a boolean value';
  }

  if (settings.soundEffects !== undefined && typeof settings.soundEffects !== 'boolean') {
    errors.soundEffects = 'Sound effects must be a boolean value';
  }

  if (settings.theme && !['light', 'dark', 'system'].includes(settings.theme)) {
    errors.theme = 'Theme must be one of: light, dark, system';
  }

  // 验证Settings类型结构的特有字段
  if (isSettingsType) {
    const settingsObj = settings as Partial<Settings>;
    
    if (settingsObj.workDuration !== undefined) {
      if (typeof settingsObj.workDuration !== 'number' || settingsObj.workDuration <= 0 || settingsObj.workDuration > 60) {
        errors.workDuration = 'Work duration must be a number between 1 and 60 minutes';
      }
    }

    if (settingsObj.shortBreakDuration !== undefined) {
      if (typeof settingsObj.shortBreakDuration !== 'number' || settingsObj.shortBreakDuration <= 0 || settingsObj.shortBreakDuration > 30) {
        errors.shortBreakDuration = 'Short break duration must be a number between 1 and 30 minutes';
      }
    }

    if (settingsObj.longBreakDuration !== undefined) {
      if (typeof settingsObj.longBreakDuration !== 'number' || settingsObj.longBreakDuration <= 0 || settingsObj.longBreakDuration > 60) {
        errors.longBreakDuration = 'Long break duration must be a number between 1 and 60 minutes';
      }
    }

    if (settingsObj.longBreakInterval !== undefined) {
      if (typeof settingsObj.longBreakInterval !== 'number' || settingsObj.longBreakInterval <= 0 || settingsObj.longBreakInterval > 10) {
        errors.longBreakInterval = 'Long break interval must be a number between 1 and 10';
      }
    }

    if (settingsObj.autoStartBreaks !== undefined && typeof settingsObj.autoStartBreaks !== 'boolean') {
      errors.autoStartBreaks = 'autoStartBreaks must be a boolean value';
    }

    if (settingsObj.autoStartPomodoros !== undefined && typeof settingsObj.autoStartPomodoros !== 'boolean') {
      errors.autoStartPomodoros = 'autoStartPomodoros must be a boolean value';
    }

    if (settingsObj.soundEnabled !== undefined && typeof settingsObj.soundEnabled !== 'boolean') {
      errors.soundEnabled = 'soundEnabled must be a boolean value';
    }

    if (settingsObj.notificationsEnabled !== undefined && typeof settingsObj.notificationsEnabled !== 'boolean') {
      errors.notificationsEnabled = 'notificationsEnabled must be a boolean value';
    }

    if (settingsObj.accentColor !== undefined && typeof settingsObj.accentColor !== 'string') {
      errors.accentColor = 'accentColor must be a string value';
    }

    if (settingsObj.fontSize !== undefined && !['small', 'medium', 'large'].includes(settingsObj.fontSize)) {
      errors.fontSize = 'fontSize must be one of: small, medium, large';
    }

    if (settingsObj.showKeyboardShortcuts !== undefined && typeof settingsObj.showKeyboardShortcuts !== 'boolean') {
      errors.showKeyboardShortcuts = 'showKeyboardShortcuts must be a boolean value';
    }

    if (settingsObj.showMicroBreakReminders !== undefined && typeof settingsObj.showMicroBreakReminders !== 'boolean') {
      errors.showMicroBreakReminders = 'showMicroBreakReminders must be a boolean value';
    }

    if (settingsObj.microBreakInterval !== undefined) {
      if (typeof settingsObj.microBreakInterval !== 'number' || settingsObj.microBreakInterval <= 0 || settingsObj.microBreakInterval > 60) {
        errors.microBreakInterval = 'microBreakInterval must be a number between 1 and 60 minutes';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * 验证会话数据
 * @param session 会话数据对象
 * @returns 验证结果对象，包含是否有效和错误信息
 */
export function validateSessionData(session: Partial<SessionData>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // 验证ID
  if (session.id !== undefined) {
    if (typeof session.id !== 'string' || session.id.trim() === '') {
      errors.id = 'Session ID must be a non-empty string';
    }
  }

  // 验证类型
  if (session.type !== undefined) {
    if (!['focus', 'shortBreak', 'longBreak', 'microBreak'].includes(session.type)) {
      errors.type = 'Session type must be one of: focus, shortBreak, longBreak, microBreak';
    }
  }

  // 验证开始时间
  if (session.startTime !== undefined) {
    try {
      const date = new Date(session.startTime);
      if (isNaN(date.getTime())) {
        errors.startTime = 'Start time must be a valid ISO date string';
      }
    } catch (e) {
      errors.startTime = 'Start time must be a valid ISO date string';
    }
  }

  // 验证持续时间
  if (session.duration !== undefined) {
    if (typeof session.duration !== 'number' || session.duration <= 0) {
      errors.duration = 'Duration must be a positive number';
    }
  }

  // 验证完成状态
  if (session.completed !== undefined && typeof session.completed !== 'boolean') {
    errors.completed = 'Completed must be a boolean value';
  }

  // 验证标签
  if (session.tags !== undefined) {
    if (!Array.isArray(session.tags) || session.tags.some(tag => typeof tag !== 'string')) {
      errors.tags = 'Tags must be an array of strings';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * 验证用户输入
 * @param input 用户输入值
 * @param options 验证选项
 * @returns 验证结果
 */
export function validateUserInput(
  input: string | null | undefined,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    type?: 'email' | 'text' | 'number';
    pattern?: RegExp;
  } = {}
): boolean {
  // 处理空值
  if (input === null || input === undefined || input === '') {
    return !options.required;
  }

  const strInput = String(input);

  // 验证长度
  if (options.minLength !== undefined && strInput.length < options.minLength) {
    return false;
  }

  if (options.maxLength !== undefined && strInput.length > options.maxLength) {
    return false;
  }

  // 验证类型
  if (options.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(strInput);
  }

  if (options.type === 'number') {
    return !isNaN(Number(strInput));
  }

  // 验证模式
  if (options.pattern) {
    return options.pattern.test(strInput);
  }

  return true;
}

/**
 * 验证时间格式 (HH:MM)
 * @param timeString 时间字符串
 * @returns 是否为有效的时间格式
 */
export function isValidTimeFormat(timeString: string): boolean {
  const timeRegex = /^([0-9]{2}):([0-5][0-9])$/;
  if (!timeRegex.test(timeString)) {
    return false;
  }

  const [hours, minutes] = timeString.split(':').map(Number);
  return hours >= 0 && minutes >= 0 && minutes < 60;
}

/**
 * 验证十六进制颜色代码
 * @param hexColor 十六进制颜色字符串
 * @returns 是否为有效的十六进制颜色代码
 */
export function validateColorHex(hexColor: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(hexColor);
}

/**
 * 验证正数
 * @param number 要验证的数字
 * @param options 验证选项
 * @returns 是否为有效的正数
 */
export function validatePositiveNumber(
  number: number | string,
  options: {
    isString?: boolean;
    min?: number;
    max?: number;
  } = {}
): boolean {
  let numValue: number;

  if (options.isString && typeof number === 'string') {
    numValue = Number(number);
    if (isNaN(numValue)) {
      return false;
    }
  } else if (typeof number === 'number') {
    numValue = number;
  } else {
    return false;
  }

  if (numValue <= 0) {
    return false;
  }

  if (options.min !== undefined && numValue < options.min) {
    return false;
  }

  if (options.max !== undefined && numValue > options.max) {
    return false;
  }

  return true;
}

/**
 * 验证百分比
 * @param percentage 要验证的百分比
 * @param options 验证选项
 * @returns 是否为有效的百分比
 */
export function validatePercentage(
  percentage: number | string,
  options: {
    isString?: boolean;
  } = {}
): boolean {
  return validatePositiveNumber(percentage, {
    isString: options.isString,
    min: 0,
    max: 100
  });
}

/**
 * 验证时间范围
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 是否为有效的时间范围
 */
export function validateTimeRange(startTime: number, endTime: number): boolean {
  if (typeof startTime !== 'number' || typeof endTime !== 'number') {
    return false;
  }

  if (startTime < 0 || endTime < 0) {
    return false;
  }

  return startTime <= endTime;
}
