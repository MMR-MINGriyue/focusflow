/**
 * 段位系统组件
 * 参考游戏段位设计，为用户提供清晰的成长路径
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  Trophy, 
  Star, 
  ChevronUp, 
  ChevronDown,
  Target,
  Zap,
  Award,
  Crown,
  Medal,
  Shield
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStatsStore } from '../../stores/statsStore';
import { useUnifiedTimerStore } from '../../stores/unifiedTimerStore';

interface RankingTier {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  minPoints: number;
  maxPoints: number;
  benefits: string[];
}

interface UserRanking {
  currentTier: string;
  points: number;
  progress: number; // 0-100
  nextTierPoints: number;
  currentTierPoints: number;
  achievements: {
    total: number;
    unlocked: number;
    rare: number;
    epic: number;
    legendary: number;
  };
}

const rankingTiers: RankingTier[] = [
  {
    id: 'bronze',
    name: '青铜',
    description: '专注之旅的起点',
    icon: <Medal className="h-8 w-8" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    minPoints: 0,
    maxPoints: 99,
    benefits: ['基础专注统计', '成就系统解锁', '每日专注提醒']
  },
  {
    id: 'silver',
    name: '白银',
    description: '专注习惯的养成',
    icon: <Shield className="h-8 w-8" />,
    color: 'text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300 dark:border-gray-700',
    minPoints: 100,
    maxPoints: 299,
    benefits: ['高级数据分析', '自定义专注时长', '专注报告导出']
  },
  {
    id: 'gold',
    name: '黄金',
    description: '专注力的大师',
    icon: <Award className="h-8 w-8" />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    minPoints: 300,
    maxPoints: 599,
    benefits: ['智能专注建议', '成就徽章展示', '专注模式高级设置']
  },
  {
    id: 'platinum',
    name: '铂金',
    description: '专注艺术的专家',
    icon: <Star className="h-8 w-8" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    minPoints: 600,
    maxPoints: 999,
    benefits: ['个性化专注计划', '高级成就解锁', '专属主题']
  },
  {
    id: 'diamond',
    name: '钻石',
    description: '专注力的传奇',
    icon: <Zap className="h-8 w-8" />,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
    minPoints: 1000,
    maxPoints: 1999,
    benefits: ['AI专注助手', '成就排行榜', '专属客服支持']
  },
  {
    id: 'master',
    name: '大师',
    description: '专注之道的宗师',
    icon: <Crown className="h-8 w-8" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    minPoints: 2000,
    maxPoints: 2999,
    benefits: ['大师专属功能', '成就定制', '优先体验新功能']
  },
  {
    id: 'grandmaster',
    name: '宗师',
    description: '专注力的巅峰',
    icon: <Trophy className="h-8 w-8" />,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    minPoints: 3000,
    maxPoints: Infinity,
    benefits: ['宗师专属标识', '成就系统定制', '专属社区身份']
  }
];

const RankingSystem: React.FC = () => {
  const [userRanking, setUserRanking] = useState<UserRanking | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [showAllTiers, setShowAllTiers] = useState(false);

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

    // 成就积分 (根据成就稀有度)
    // 这里简化处理，实际应该从成就系统获取
    const achievementPoints = 0; // 实际应该从成就系统获取
    points += achievementPoints;

    // 确定当前段位
    let currentTier = rankingTiers[0].id;
    let currentTierPoints = 0;
    let nextTierPoints = rankingTiers[0].maxPoints;

    for (let i = rankingTiers.length - 1; i >= 0; i--) {
      if (points >= rankingTiers[i].minPoints) {
        currentTier = rankingTiers[i].id;
        currentTierPoints = rankingTiers[i].minPoints;
        nextTierPoints = i < rankingTiers.length - 1 ? rankingTiers[i + 1].minPoints : points;
        break;
      }
    }

    // 计算进度
    const tier = rankingTiers.find(t => t.id === currentTier);
    const progress = tier ? 
      ((points - tier.minPoints) / (tier.maxPoints - tier.minPoints)) * 100 : 0;

    // 成就统计 (简化处理)
    const achievements = {
      total: 20, // 总成就数
      unlocked: Math.min(20, Math.floor(points / 50)), // 已解锁成就数
      rare: Math.min(5, Math.floor(points / 200)), // 稀有成就数
      epic: Math.min(3, Math.floor(points / 500)), // 史诗成就数
      legendary: Math.min(1, Math.floor(points / 1000)) // 传说成就数
    };

    return {
      currentTier,
      points,
      progress: Math.min(100, progress),
      nextTierPoints,
      currentTierPoints,
      achievements
    };
  }, [totalFocusTime, completedSessions, currentStreak]);

  // 更新用户段位信息
  useEffect(() => {
    if (!statsLoading) {
      const ranking = calculateUserRanking();
      setUserRanking(ranking);
      setSelectedTier(ranking.currentTier);
    }
  }, [statsLoading, calculateUserRanking]);

  // 获取当前段位信息
  const getCurrentTierInfo = () => {
    if (!userRanking) return null;
    return rankingTiers.find(tier => tier.id === userRanking.currentTier);
  };

  // 获取下一级段位信息
  const getNextTierInfo = () => {
    if (!userRanking) return null;
    const currentIndex = rankingTiers.findIndex(tier => tier.id === userRanking.currentTier);
    if (currentIndex < rankingTiers.length - 1) {
      return rankingTiers[currentIndex + 1];
    }
    return null; // 已达到最高段位
  };

  // 获取显示的段位列表
  const getVisibleTiers = () => {
    if (!userRanking) return rankingTiers;

    const currentIndex = rankingTiers.findIndex(tier => tier.id === userRanking.currentTier);

    if (showAllTiers) {
      return rankingTiers;
    }

    // 显示当前段位及前后各两个段位
    const startIndex = Math.max(0, currentIndex - 2);
    const endIndex = Math.min(rankingTiers.length - 1, currentIndex + 2);

    return rankingTiers.slice(startIndex, endIndex + 1);
  };

  // 获取段位索引
  const getTierIndex = (tierId: string) => {
    return rankingTiers.findIndex(tier => tier.id === tierId);
  };

  if (!userRanking) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">加载段位系统中...</p>
        </div>
      </div>
    );
  }

  const currentTierInfo = getCurrentTierInfo();
  const nextTierInfo = getNextTierInfo();
  const visibleTiers = getVisibleTiers();
  const currentTierIndex = getTierIndex(userRanking.currentTier);

  return (
    <div className="space-y-6">
      {/* 当前段位概览 */}
      {currentTierInfo && (
        <Card className={cn("overflow-hidden", currentTierInfo.bgColor, currentTierInfo.borderColor)}>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-4">
                <div className={cn("p-3 rounded-full", currentTierInfo.bgColor)}>
                  <div className={currentTierInfo.color}>
                    {currentTierInfo.icon}
                  </div>
                </div>
                <div>
                  <CardTitle className={cn("text-xl", currentTierInfo.color)}>
                    {currentTierInfo.name}段位
                  </CardTitle>
                  <CardDescription>
                    {currentTierInfo.description}
                  </CardDescription>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="text-2xl font-bold">{userRanking.points} 积分</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {nextTierInfo ? 
                    `距离${nextTierInfo.name}还需${nextTierInfo.minPoints - userRanking.points}积分` :
                    '已达到最高段位！'
                  }
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 进度条 */}
              {nextTierInfo && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>当前段位进度</span>
                    <span>{Math.round(userRanking.progress)}%</span>
                  </div>
                  <Progress 
                    value={userRanking.progress} 
                    className="h-3"
                    indicatorClassName={currentTierInfo.color.replace('text-', 'bg-')}
                  />
                </div>
              )}

              {/* 段位特权 */}
              <div>
                <h3 className="font-medium mb-2">段位特权</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {currentTierInfo.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className={cn("w-2 h-2 rounded-full", currentTierInfo.color.replace('text-', 'bg-'))}></div>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 段位路径 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>段位路径</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAllTiers(!showAllTiers)}
            >
              {showAllTiers ? '收起' : '查看全部'}
            </Button>
          </div>
          <CardDescription>
            您的专注成长之路，每个段位都有独特的特权
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* 段位连接线 */}
            <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

            <div className="space-y-8">
              {visibleTiers.map((tier, index) => {
                const tierIndex = getTierIndex(tier.id);
                const isCurrentTier = tier.id === userRanking.currentTier;
                const isCompleted = tierIndex < currentTierIndex;
                const isLocked = tierIndex > currentTierIndex;

                return (
                  <div key={tier.id} className="relative pl-12">
                    {/* 段位节点 */}
                    <div className={cn(
                      "absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border-2",
                      isCurrentTier ? cn(tier.borderColor, "bg-white dark:bg-gray-800") :
                      isCompleted ? cn(tier.borderColor, tier.bgColor) :
                      cn("border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800")
                    )}>
                      <div className={cn(
                        isCurrentTier || isCompleted ? tier.color : "text-gray-400"
                      )}>
                        {tier.icon}
                      </div>
                    </div>

                    {/* 段位信息 */}
                    <div className={cn(
                      "rounded-lg border p-4",
                      isCurrentTier ? cn(tier.borderColor, tier.bgColor) :
                      isCompleted ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50" :
                      "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 opacity-70"
                    )}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className={cn(
                            "font-semibold flex items-center space-x-2",
                            isCurrentTier || isCompleted ? tier.color : "text-gray-500"
                          )}>
                            <span>{tier.name}段位</span>
                            {isCurrentTier && (
                              <Badge variant="outline" className={cn("text-xs", tier.borderColor)}>
                                当前
                              </Badge>
                            )}
                            {isCompleted && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                已完成
                              </Badge>
                            )}
                            {isLocked && (
                              <Badge variant="outline" className="text-gray-500 border-gray-500">
                                未解锁
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {tier.description}
                          </p>
                          <div className="mt-2 text-sm">
                            <span className="font-medium">{tier.minPoints}-{tier.maxPoints === Infinity ? '∞' : tier.maxPoints}</span>
                            <span className="text-gray-500 dark:text-gray-400"> 积分</span>
                          </div>
                        </div>

                        {tierIndex > currentTierIndex && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            距离解锁还需 {tier.minPoints - userRanking.points} 积分
                          </div>
                        )}
                      </div>

                      {/* 段位特权 */}
                      <div className="mt-3">
                        <h4 className="text-sm font-medium mb-2">段位特权</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                          {tier.benefits.map((benefit, benefitIndex) => (
                            <div key={benefitIndex} className="flex items-center space-x-1 text-xs">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isCurrentTier || isCompleted ? tier.color.replace('text-', 'bg-') : "bg-gray-300"
                              )}></div>
                              <span className={isCurrentTier || isCompleted ? "" : "text-gray-500"}>
                                {benefit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 导航按钮 */}
          {!showAllTiers && (
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentTierIndex <= 2}
                onClick={() => {
                  const firstVisibleTier = getVisibleTiers()[0];
                  const firstVisibleIndex = getTierIndex(firstVisibleTier.id);
                  if (firstVisibleIndex > 0) {
                    const newStartIndex = Math.max(0, firstVisibleIndex - 1);
                    const newEndIndex = Math.min(rankingTiers.length - 1, newStartIndex + 4);
                    // 这里应该更新visibleTiers，但为了简化，我们使用showAllTiers
                    setShowAllTiers(true);
                  }
                }}
              >
                <ChevronUp className="h-4 w-4 mr-1" />
                查看更低段位
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentTierIndex >= rankingTiers.length - 3}
                onClick={() => {
                  const lastVisibleTier = getVisibleTiers()[getVisibleTiers().length - 1];
                  const lastVisibleIndex = getTierIndex(lastVisibleTier.id);
                  if (lastVisibleIndex < rankingTiers.length - 1) {
                    // 这里应该更新visibleTiers，但为了简化，我们使用showAllTiers
                    setShowAllTiers(true);
                  }
                }}
              >
                查看更高段位
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingSystem;
