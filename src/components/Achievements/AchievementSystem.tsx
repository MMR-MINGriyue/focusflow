/**
 * 成就系统组件
 * 激励用户保持专注，提供成就解锁和展示功能
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
  Lock
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStatsStore } from '../../stores/statsStore';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'focus' | 'consistency' | 'milestone' | 'special';
  requirement: {
    type: 'focusTime' | 'sessions' | 'streak' | 'totalTime';
    value: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number; // 0-100
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
];

const AchievementSystem: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // 获取统计数据
  const { stats, isLoading: statsLoading } = useStatsStore();
  const { totalFocusTime, completedSessions, currentStreak } = useUnifiedTimerStore();

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
      },
    ];

    return baseAchievements;
  }, []);

  // 更新成就进度和解锁状态
  const updateAchievements = useCallback(() => {
    const baseAchievements = initializeAchievements();

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
  }, [initializeAchievements, totalFocusTime, completedSessions, currentStreak]);

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* 成就分类和列表 */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-5">
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
                        "text-xl",
                        achievement.unlocked ? getRarityColor(achievement.rarity) : "text-gray-400"
                      )}>
                        {achievement.unlocked ? achievement.icon : <Lock className="h-6 w-6" />}
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getRarityColor(achievement.rarity))}
                    >
                      {getRarityText(achievement.rarity)}
                    </Badge>
                  </div>
                  <CardTitle className={cn(
                    "text-base",
                    achievement.unlocked ? "" : "text-gray-500 dark:text-gray-400"
                  )}>
                    {achievement.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <p className={cn(
                    "text-sm",
                    achievement.unlocked ? "text-gray-600 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"
                  )}>
                    {achievement.description}
                  </p>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>进度</span>
                      <span>{Math.round(achievement.progress)}%</span>
                    </div>
                    <Progress 
                      value={achievement.progress} 
                      className="h-2"
                      indicatorClassName={
                        achievement.unlocked 
                          ? achievement.rarity === 'common' ? "bg-gray-500" :
                            achievement.rarity === 'rare' ? "bg-blue-500" :
                            achievement.rarity === 'epic' ? "bg-purple-500" : "bg-yellow-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      }
                    />
                  </div>

                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Award className="h-3 w-3 mr-1" />
                      解锁于 {achievement.unlockedAt.toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAchievements.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                {activeCategory === 'unlocked' ? '您还没有解锁任何成就' : '此分类下没有成就'}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AchievementSystem;
