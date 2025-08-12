/**
 * 增强版成就系统组件
 * 整合段位系统，提供更丰富的成就体验
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { 
  Trophy, 
  Star, 
  Target, 
  Calendar, 
  Clock, 
  Award,
  TrendingUp,
  CheckCircle,
  Lock,
  Crown,
  Zap,
  Medal,
  Shield
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStatsStore } from '../../stores/statsStore';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';
import RankingSystem from './RankingSystem';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'focus' | 'consistency' | 'milestone' | 'special' | 'ranking';
  requirement: {
    type: 'focusTime' | 'sessions' | 'streak' | 'totalTime' | 'ranking';
    value: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number; // 0-100
  points: number; // 成就积分
}

interface AchievementCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const achievementCategories: AchievementCategory[] = [
  {
    id: 'all',
    name: '全部成就',
    description: '查看所有可获得的成就',
    icon: <Trophy className="h-5 w-5" />,
  },
  {
    id: 'unlocked',
    name: '已解锁',
    description: '您已经获得的成就',
    icon: <CheckCircle className="h-5 w-5" />,
  },
  {
    id: 'focus',
    name: '专注成就',
    description: '与专注时间相关的成就',
    icon: <Target className="h-5 w-5" />,
  },
  {
    id: 'consistency',
    name: '坚持成就',
    description: '与连续使用相关的成就',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    id: 'milestone',
    name: '里程碑成就',
    description: '重要的使用里程碑',
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    id: 'ranking',
    name: '段位成就',
    description: '与段位提升相关的成就',
    icon: <Award className="h-5 w-5" />,
  },
];

const EnhancedAchievementSystem: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [userRanking, setUserRanking] = useState<{
    currentTier: string;
    points: number;
  } | null>(null);

  // 获取统计数据
  const { stats, isLoading: statsLoading } = useStatsStore();
  const { totalFocusTime, completedSessions, currentStreak } = useUnifiedTimerStore();

  // 计算用户段位和积分
  const calculateUserRanking = useCallback(() => {
    // 基础积分计算
    let points = 0;

    // 专注时间积分 (每分钟1分)
    points += totalFocusTime;

    // 完成会话积分 (每个会话5分)
    points += completedSessions * 5;

    // 连续天数积分 (每天10分)
    points += currentStreak * 10;

    // 确定当前段位
    let currentTier = 'bronze';

    if (points >= 3000) currentTier = 'grandmaster';
    else if (points >= 2000) currentTier = 'master';
    else if (points >= 1000) currentTier = 'diamond';
    else if (points >= 600) currentTier = 'platinum';
    else if (points >= 300) currentTier = 'gold';
    else if (points >= 100) currentTier = 'silver';

    return {
      currentTier,
      points
    };
  }, [totalFocusTime, completedSessions, currentStreak]);

  // 初始化成就数据
  const initializeAchievements = useCallback(() => {
    const baseAchievements: Achievement[] = [
      // 专注成就
      {
        id: 'first-focus',
        name: '初次专注',
        description: '完成第一次专注会话',
        icon: <Target className="h-6 w-6" />,
        category: 'focus',
        requirement: { type: 'sessions', value: 1 },
        rarity: 'common',
        unlocked: false,
        progress: 0,
        points: 10,
      },
      {
        id: 'focus-novice',
        name: '专注新手',
        description: '累计专注时间达到1小时',
        icon: <Clock className="h-6 w-6" />,
        category: 'focus',
        requirement: { type: 'focusTime', value: 60 },
        rarity: 'common',
        unlocked: false,
        progress: 0,
        points: 20,
      },
      {
        id: 'focus-adept',
        name: '专注熟手',
        description: '累计专注时间达到5小时',
        icon: <Clock className="h-6 w-6" />,
        category: 'focus',
        requirement: { type: 'focusTime', value: 300 },
        rarity: 'rare',
        unlocked: false,
        progress: 0,
        points: 50,
      },
      {
        id: 'focus-expert',
        name: '专注专家',
        description: '累计专注时间达到25小时',
        icon: <Clock className="h-6 w-6" />,
        category: 'focus',
        requirement: { type: 'focusTime', value: 1500 },
        rarity: 'epic',
        unlocked: false,
        progress: 0,
        points: 100,
      },
      {
        id: 'focus-master',
        name: '专注大师',
        description: '累计专注时间达到100小时',
        icon: <Clock className="h-6 w-6" />,
        category: 'focus',
        requirement: { type: 'focusTime', value: 6000 },
        rarity: 'legendary',
        unlocked: false,
        progress: 0,
        points: 200,
      },

      // 坚持成就
      {
        id: 'streak-3',
        name: '三天坚持',
        description: '连续使用应用3天',
        icon: <Calendar className="h-6 w-6" />,
        category: 'consistency',
        requirement: { type: 'streak', value: 3 },
        rarity: 'common',
        unlocked: false,
        progress: 0,
        points: 15,
      },
      {
        id: 'streak-7',
        name: '一周坚持',
        description: '连续使用应用7天',
        icon: <Calendar className="h-6 w-6" />,
        category: 'consistency',
        requirement: { type: 'streak', value: 7 },
        rarity: 'rare',
        unlocked: false,
        progress: 0,
        points: 30,
      },
      {
        id: 'streak-30',
        name: '月度坚持',
        description: '连续使用应用30天',
        icon: <Calendar className="h-6 w-6" />,
        category: 'consistency',
        requirement: { type: 'streak', value: 30 },
        rarity: 'epic',
        unlocked: false,
        progress: 0,
        points: 75,
      },

      // 里程碑成就
      {
        id: 'sessions-10',
        name: '十次会话',
        description: '完成10次专注会话',
        icon: <Target className="h-6 w-6" />,
        category: 'milestone',
        requirement: { type: 'sessions', value: 10 },
        rarity: 'common',
        unlocked: false,
        progress: 0,
        points: 25,
      },
      {
        id: 'sessions-50',
        name: '五十次会话',
        description: '完成50次专注会话',
        icon: <Target className="h-6 w-6" />,
        category: 'milestone',
        requirement: { type: 'sessions', value: 50 },
        rarity: 'rare',
        unlocked: false,
        progress: 0,
        points: 60,
      },
      {
        id: 'sessions-100',
        name: '百次会话',
        description: '完成100次专注会话',
        icon: <Target className="h-6 w-6" />,
        category: 'milestone',
        requirement: { type: 'sessions', value: 100 },
        rarity: 'epic',
        unlocked: false,
        progress: 0,
        points: 120,
      },

      // 段位成就
      {
        id: 'rank-bronze',
        name: '青铜段位',
        description: '达到青铜段位',
        icon: <Medal className="h-6 w-6" />,
        category: 'ranking',
        requirement: { type: 'ranking', value: 100 },
        rarity: 'common',
        unlocked: false,
        progress: 0,
        points: 30,
      },
      {
        id: 'rank-silver',
        name: '白银段位',
        description: '达到白银段位',
        icon: <Shield className="h-6 w-6" />,
        category: 'ranking',
        requirement: { type: 'ranking', value: 300 },
        rarity: 'rare',
        unlocked: false,
        progress: 0,
        points: 70,
      },
      {
        id: 'rank-gold',
        name: '黄金段位',
        description: '达到黄金段位',
        icon: <Award className="h-6 w-6" />,
        category: 'ranking',
        requirement: { type: 'ranking', value: 600 },
        rarity: 'epic',
        unlocked: false,
        progress: 0,
        points: 150,
      },
      {
        id: 'rank-platinum',
        name: '铂金段位',
        description: '达到铂金段位',
        icon: <Star className="h-6 w-6" />,
        category: 'ranking',
        requirement: { type: 'ranking', value: 1000 },
        rarity: 'epic',
        unlocked: false,
        progress: 0,
        points: 250,
      },
      {
        id: 'rank-diamond',
        name: '钻石段位',
        description: '达到钻石段位',
        icon: <Zap className="h-6 w-6" />,
        category: 'ranking',
        requirement: { type: 'ranking', value: 2000 },
        rarity: 'legendary',
        unlocked: false,
        progress: 0,
        points: 400,
      },
      {
        id: 'rank-master',
        name: '大师段位',
        description: '达到大师段位',
        icon: <Crown className="h-6 w-6" />,
        category: 'ranking',
        requirement: { type: 'ranking', value: 3000 },
        rarity: 'legendary',
        unlocked: false,
        progress: 0,
        points: 600,
      },
    ];

    return baseAchievements;
  }, []);

  // 更新成就进度和解锁状态
  const updateAchievements = useCallback(() => {
    const baseAchievements = initializeAchievements();
    const ranking = calculateUserRanking();
    setUserRanking(ranking);

    const updatedAchievements = baseAchievements.map(achievement => {
      let progress = 0;
      let unlocked = false;

      // 根据成就类型计算进度
      switch (achievement.requirement.type) {
        case 'focusTime':
          progress = Math.min(100, (totalFocusTime / achievement.requirement.value) * 100);
          unlocked = totalFocusTime >= achievement.requirement.value;
          break;
        case 'sessions':
          progress = Math.min(100, (completedSessions / achievement.requirement.value) * 100);
          unlocked = completedSessions >= achievement.requirement.value;
          break;
        case 'streak':
          progress = Math.min(100, (currentStreak / achievement.requirement.value) * 100);
          unlocked = currentStreak >= achievement.requirement.value;
          break;
        case 'ranking':
          progress = Math.min(100, (ranking.points / achievement.requirement.value) * 100);
          unlocked = ranking.points >= achievement.requirement.value;
          break;
        default:
          progress = 0;
          unlocked = false;
      }

      return {
        ...achievement,
        progress,
        unlocked,
        unlockedAt: unlocked ? new Date() : undefined,
      };
    });

    setAchievements(updatedAchievements);
    setIsLoading(false);
  }, [initializeAchievements, totalFocusTime, completedSessions, currentStreak, calculateUserRanking]);

  // 当统计数据加载完成后更新成就
  useEffect(() => {
    if (!statsLoading) {
      updateAchievements();
    }
  }, [statsLoading, updateAchievements]);

  // 获取稀有度颜色
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-600 dark:text-gray-400';
      case 'rare':
        return 'text-blue-600 dark:text-blue-400';
      case 'epic':
        return 'text-purple-600 dark:text-purple-400';
      case 'legendary':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // 获取稀有度背景色
  const getRarityBgColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 dark:bg-gray-800';
      case 'rare':
        return 'bg-blue-100 dark:bg-blue-900/20';
      case 'epic':
        return 'bg-purple-100 dark:bg-purple-900/20';
      case 'legendary':
        return 'bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  // 获取稀有度文本
  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return '普通';
      case 'rare':
        return '稀有';
      case 'epic':
        return '史诗';
      case 'legendary':
        return '传说';
      default:
        return '未知';
    }
  };

  // 过滤成就
  const filteredAchievements = achievements.filter(achievement => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'unlocked') return achievement.unlocked;
    return achievement.category === activeCategory;
  });

  // 计算成就统计
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // 计算成就积分
  const totalPoints = achievements.reduce((sum, achievement) => 
    achievement.unlocked ? sum + achievement.points : sum, 0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">加载成就系统中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 段位系统 */}
      <RankingSystem />

      {/* 成就概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>成就系统</span>
          </CardTitle>
          <CardDescription>
            通过专注和使用应用解锁成就，记录您的成长历程
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{unlockedCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">已解锁成就</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{totalCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">总成就数</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{completionPercentage}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">完成度</div>
              <Progress value={completionPercentage} className="mt-2 h-2" />
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold">{totalPoints}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">成就积分</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 成就分类和列表 */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-6">
          {achievementCategories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center space-x-1">
              {category.icon}
              <span className="hidden sm:inline">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map(achievement => (
              <Card 
                key={achievement.id} 
                className={cn(
                  "transition-all duration-200",
                  achievement.unlocked 
                    ? getRarityBgColor(achievement.rarity) 
                    : "opacity-70 hover:opacity-100"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className={cn(
                      "p-2 rounded-full",
                      achievement.unlocked 
                        ? getRarityBgColor(achievement.rarity) 
                        : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      <div className={cn(
                        "text-lg",
                        achievement.unlocked 
                          ? getRarityColor(achievement.rarity) 
                          : "text-gray-400"
                      )}>
                        {achievement.icon}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          achievement.unlocked 
                            ? getRarityColor(achievement.rarity) 
                            : "text-gray-400"
                        )}
                      >
                        {getRarityText(achievement.rarity)}
                      </Badge>
                      {achievement.unlocked && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          +{achievement.points}分
                        </div>
                      )}
                    </div>
                  </div>
                  <CardTitle className={cn(
                    "text-base",
                    achievement.unlocked 
                      ? "" 
                      : "text-gray-500 dark:text-gray-400"
                  )}>
                    {achievement.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className={cn(
                    "text-sm",
                    achievement.unlocked 
                      ? "" 
                      : "text-gray-500 dark:text-gray-400"
                  )}>
                    {achievement.description}
                  </CardDescription>

                  {/* 进度条 */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>进度</span>
                      <span>{Math.round(achievement.progress)}%</span>
                    </div>
                    <Progress 
                      value={achievement.progress} 
                      className="h-2"
                      indicatorClassName={
                        achievement.unlocked 
                          ? getRarityColor(achievement.rarity).replace('text-', 'bg-')
                          : "bg-gray-300 dark:bg-gray-600"
                      }
                    />
                  </div>

                  {/* 解锁状态 */}
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      解锁于 {achievement.unlockedAt.toLocaleDateString()}
                    </div>
                  )}

                  {/* 未解锁提示 */}
                  {!achievement.unlocked && (
                    <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Lock className="h-3 w-3 mr-1" />
                      <span>
                        {achievement.requirement.type === 'focusTime' && `还需专注 ${Math.ceil((achievement.requirement.value - totalFocusTime) / 60)} 分钟`}
                        {achievement.requirement.type === 'sessions' && `还需完成 ${achievement.requirement.value - completedSessions} 次会话`}
                        {achievement.requirement.type === 'streak' && `还需连续使用 ${achievement.requirement.value - currentStreak} 天`}
                        {achievement.requirement.type === 'ranking' && `还需 ${achievement.requirement.value - (userRanking?.points || 0)} 积分`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAchievements.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">该分类下暂无成就</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedAchievementSystem;
