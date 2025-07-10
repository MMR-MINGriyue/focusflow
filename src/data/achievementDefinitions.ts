import { Achievement, AchievementTrigger } from '../types/achievements';

// 成就定义模板（不包含进度数据）
export interface AchievementDefinition extends Omit<Achievement, 'current' | 'unlocked' | 'unlockedAt'> {
  triggers: AchievementTrigger[];
  checkCondition: (data: any, userStats: any) => boolean;
}

export const achievementDefinitions: AchievementDefinition[] = [
  // 🌱 新手成就
  {
    id: 'first_focus',
    title: '初次专注',
    description: '完成第一个专注会话',
    icon: '🌱',
    category: 'milestone',
    type: 'single',
    target: 1,
    rarity: 'common',
    points: 10,
    triggers: ['focus_session_completed'],
    checkCondition: (_data, userStats) => userStats.totalFocusSessions >= 1,
  },
  {
    id: 'first_rating',
    title: '反思者',
    description: '首次提交效率评分',
    icon: '🤔',
    category: 'milestone',
    type: 'single',
    target: 1,
    rarity: 'common',
    points: 10,
    triggers: ['efficiency_rating_submitted'],
    checkCondition: (_data, userStats) => userStats.totalRatings >= 1,
  },

  // ⏰ 专注时长成就
  {
    id: 'focus_10_hours',
    title: '专注新手',
    description: '累计专注10小时',
    icon: '⏰',
    category: 'focus',
    type: 'counter',
    target: 10 * 60, // 分钟
    rarity: 'common',
    points: 25,
    triggers: ['focus_session_completed'],
    checkCondition: (_data, userStats) => userStats.totalFocusTime >= 10 * 60,
  },
  {
    id: 'focus_50_hours',
    title: '专注达人',
    description: '累计专注50小时',
    icon: '🎯',
    category: 'focus',
    type: 'counter',
    target: 50 * 60,
    rarity: 'rare',
    points: 100,
    triggers: ['focus_session_completed'],
    checkCondition: (_data, userStats) => userStats.totalFocusTime >= 50 * 60,
  },
  {
    id: 'focus_100_hours',
    title: '专注大师',
    description: '累计专注100小时',
    icon: '🏆',
    category: 'focus',
    type: 'counter',
    target: 100 * 60,
    rarity: 'epic',
    points: 250,
    triggers: ['focus_session_completed'],
    checkCondition: (_data, userStats) => userStats.totalFocusTime >= 100 * 60,
  },
  {
    id: 'focus_500_hours',
    title: '专注传说',
    description: '累计专注500小时',
    icon: '👑',
    category: 'focus',
    type: 'counter',
    target: 500 * 60,
    rarity: 'legendary',
    points: 1000,
    triggers: ['focus_session_completed'],
    checkCondition: (_data, userStats) => userStats.totalFocusTime >= 500 * 60,
  },

  // 🔥 连续性成就
  {
    id: 'streak_3_days',
    title: '三日坚持',
    description: '连续3天完成专注会话',
    icon: '🔥',
    category: 'consistency',
    type: 'streak',
    target: 3,
    rarity: 'common',
    points: 30,
    triggers: ['focus_session_completed'],
    checkCondition: (_data, userStats) => userStats.currentStreak >= 3,
  },
  {
    id: 'streak_7_days',
    title: '一周坚持',
    description: '连续7天完成专注会话',
    icon: '🌟',
    category: 'consistency',
    type: 'streak',
    target: 7,
    rarity: 'rare',
    points: 75,
    triggers: ['focus_session_completed'],
    checkCondition: (_data, userStats) => userStats.currentStreak >= 7,
  },
  {
    id: 'streak_30_days',
    title: '月度坚持',
    description: '连续30天完成专注会话',
    icon: '💎',
    category: 'consistency',
    type: 'streak',
    target: 30,
    rarity: 'epic',
    points: 300,
    triggers: ['focus_session_completed'],
    checkCondition: (_data, userStats) => userStats.currentStreak >= 30,
  },

  // ⭐ 效率成就
  {
    id: 'high_efficiency',
    title: '效率之星',
    description: '单次专注会话获得5星评分',
    icon: '⭐',
    category: 'efficiency',
    type: 'single',
    target: 5,
    rarity: 'rare',
    points: 50,
    triggers: ['efficiency_rating_submitted'],
    checkCondition: (data, _userStats) => data.rating?.overallRating >= 5,
  },
  {
    id: 'consistent_efficiency',
    title: '稳定高效',
    description: '平均效率评分达到4.5星',
    icon: '🌟',
    category: 'efficiency',
    type: 'ratio',
    target: 4.5,
    rarity: 'epic',
    points: 200,
    triggers: ['efficiency_rating_submitted'],
    checkCondition: (_data, userStats) => userStats.averageEfficiency >= 4.5,
  },

  // 🎉 特殊成就
  {
    id: 'marathon_session',
    title: '马拉松专注',
    description: '单次专注超过3小时',
    icon: '🏃‍♂️',
    category: 'special',
    type: 'single',
    target: 180, // 分钟
    rarity: 'epic',
    points: 150,
    triggers: ['focus_session_completed'],
    checkCondition: (data, _userStats) => data.sessionDuration >= 180,
  },
  {
    id: 'early_bird',
    title: '早起鸟',
    description: '在早上6点前开始专注会话',
    icon: '🐦',
    category: 'special',
    type: 'single',
    target: 1,
    rarity: 'rare',
    points: 40,
    triggers: ['focus_session_completed'],
    checkCondition: (data, _userStats) => {
      const hour = new Date(data.startTime).getHours();
      return hour >= 5 && hour < 6;
    },
  },
  {
    id: 'night_owl',
    title: '夜猫子',
    description: '在晚上11点后开始专注会话',
    icon: '🦉',
    category: 'special',
    type: 'single',
    target: 1,
    rarity: 'rare',
    points: 40,
    triggers: ['focus_session_completed'],
    checkCondition: (data, _userStats) => {
      const hour = new Date(data.startTime).getHours();
      return hour >= 23 || hour < 5;
    },
  },
  {
    id: 'perfectionist',
    title: '完美主义者',
    description: '连续10次专注会话都获得5星评分',
    icon: '💯',
    category: 'special',
    type: 'streak',
    target: 10,
    rarity: 'legendary',
    points: 500,
    hidden: true,
    triggers: ['efficiency_rating_submitted'],
    checkCondition: (_data, userStats) => userStats.perfectRatingStreak >= 10,
  },

  // 📊 里程碑成就
  {
    id: 'century_sessions',
    title: '百次专注',
    description: '完成100次专注会话',
    icon: '💯',
    category: 'milestone',
    type: 'counter',
    target: 100,
    rarity: 'epic',
    points: 200,
    triggers: ['focus_session_completed'],
    checkCondition: (_data, userStats) => userStats.totalFocusSessions >= 100,
  },
  {
    id: 'micro_break_master',
    title: '微休息大师',
    description: '完成500次微休息',
    icon: '☕',
    category: 'milestone',
    type: 'counter',
    target: 500,
    rarity: 'rare',
    points: 150,
    triggers: ['micro_break_completed'],
    checkCondition: (_data, userStats) => userStats.totalMicroBreaks >= 500,
  },
];

// 根据稀有度获取颜色
export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'common': return 'text-green-600 bg-green-100';
    case 'rare': return 'text-blue-600 bg-blue-100';
    case 'epic': return 'text-purple-600 bg-purple-100';
    case 'legendary': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

// 根据稀有度获取边框颜色
export const getRarityBorder = (rarity: string): string => {
  switch (rarity) {
    case 'common': return 'border-green-300';
    case 'rare': return 'border-blue-300';
    case 'epic': return 'border-purple-300';
    case 'legendary': return 'border-yellow-300';
    default: return 'border-gray-300';
  }
};
