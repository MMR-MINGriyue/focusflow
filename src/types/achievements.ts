export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji或图标名称
  category: AchievementCategory;
  type: AchievementType;
  target: number; // 目标值
  current: number; // 当前进度
  unlocked: boolean;
  unlockedAt?: string; // ISO日期字符串
  rarity: AchievementRarity;
  points: number; // 成就点数
  hidden?: boolean; // 是否为隐藏成就
}

export type AchievementCategory = 
  | 'focus' // 专注相关
  | 'consistency' // 坚持相关
  | 'efficiency' // 效率相关
  | 'milestone' // 里程碑
  | 'special' // 特殊成就
  | 'social'; // 社交相关

export type AchievementType = 
  | 'counter' // 计数型（如专注100小时）
  | 'streak' // 连续型（如连续7天）
  | 'single' // 单次型（如单次专注2小时）
  | 'ratio' // 比例型（如效率评分平均4.5星）
  | 'special'; // 特殊型（如首次使用）

export type AchievementRarity = 
  | 'common' // 普通（绿色）
  | 'rare' // 稀有（蓝色）
  | 'epic' // 史诗（紫色）
  | 'legendary'; // 传说（金色）

export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  percentage: number;
}

export interface UserAchievements {
  achievements: Achievement[];
  totalPoints: number;
  unlockedCount: number;
  lastUnlocked?: Achievement;
}

// 成就触发事件类型
export type AchievementTrigger = 
  | 'focus_session_completed'
  | 'break_session_completed'
  | 'micro_break_completed'
  | 'daily_goal_reached'
  | 'efficiency_rating_submitted'
  | 'app_opened'
  | 'settings_changed'
  | 'first_time_user';

export interface AchievementEvent {
  trigger: AchievementTrigger;
  data: Record<string, any>;
  timestamp: string;
}
