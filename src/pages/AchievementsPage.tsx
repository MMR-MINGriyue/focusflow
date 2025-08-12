/**
 * 成就系统页面
 * 展示用户已解锁和未解锁的成就
 */

import React from 'react';
import EnhancedAchievementSystem from '../components/Achievements/EnhancedAchievementSystem';
import RankingSystem from '../components/Achievements/RankingSystem';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Trophy, Award, Star } from 'lucide-react';

const AchievementsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>成就系统 - Focus Flow</title>
        <meta name="description" content="查看您在Focus Flow中解锁的成就，追踪您的专注历程" />
      </Helmet>

      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">成就与段位系统</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            通过专注和使用应用解锁成就，提升您的段位。每个成就都是您专注力的见证，每个段位都是您成长的里程碑！
          </p>
        </div>

        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="achievements" className="flex items-center space-x-2">
              <Trophy className="h-4 w-4" />
              <span>成就系统</span>
            </TabsTrigger>
            <TabsTrigger value="ranking" className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>段位系统</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="mt-0">
            <EnhancedAchievementSystem />
          </TabsContent>

          <TabsContent value="ranking" className="mt-0">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2 flex items-center justify-center space-x-2">
                  <Star className="h-6 w-6 text-yellow-500" />
                  <span>段位系统</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  通过专注和使用应用获得积分，提升您的段位，解锁更多特权和功能。每个段位都有独特的标识和专属特权！
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold mb-3 text-center">如何获得积分</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs mt-0.5">1</div>
                      <span>每专注1分钟获得1积分</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs mt-0.5">2</div>
                      <span>完成一次专注会话获得5积分</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs mt-0.5">3</div>
                      <span>连续使用应用每天获得10积分</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs mt-0.5">4</div>
                      <span>解锁成就获得额外积分</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold mb-3 text-center">段位特权</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs mt-0.5">✓</div>
                      <span>青铜：基础专注统计</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-xs mt-0.5">✓</div>
                      <span>白银：高级数据分析</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 text-xs mt-0.5">✓</div>
                      <span>黄金：智能专注建议</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs mt-0.5">✓</div>
                      <span>铂金：个性化专注计划</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xs mt-0.5">✓</div>
                      <span>钻石：AI专注助手</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold mb-3 text-center">段位等级</h3>
                  <div className="space-y-3">
                    {[
                      { name: '青铜', color: 'bg-amber-500', min: 0 },
                      { name: '白银', color: 'bg-gray-400', min: 100 },
                      { name: '黄金', color: 'bg-yellow-500', min: 300 },
                      { name: '铂金', color: 'bg-blue-400', min: 600 },
                      { name: '钻石', color: 'bg-cyan-400', min: 1000 },
                      { name: '大师', color: 'bg-purple-500', min: 2000 },
                      { name: '宗师', color: 'bg-red-500', min: 3000 },
                    ].map((tier, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${tier.color}`}></div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm">
                            <span>{tier.name}</span>
                            <span className="text-gray-500 dark:text-gray-400">{tier.min}+积分</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 这里放置段位系统组件 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <RankingSystem />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AchievementsPage;
