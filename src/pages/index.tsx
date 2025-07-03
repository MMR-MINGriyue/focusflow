import React, { useState } from 'react';
import Timer from '../components/Timer/Timer';
import Stats from '../components/Stats/Stats';
import DatabaseStats from '../components/Stats/DatabaseStats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Clock, BarChart3, Database } from 'lucide-react';
import { appWindow } from '@tauri-apps/api/window';

const Home: React.FC = () => {
  const [stats, setStats] = useState([
    {
      date: new Date().toLocaleDateString(),
      focusTime: 0,
      breakTime: 0,
      efficiency: 0,
    },
  ]);

  // 更新任务栏图标颜色
  const updateTaskbarState = async (state: 'focus' | 'break' | 'microBreak') => {
    try {
      const stateText = state === 'focus' ? '专注中' :
                       state === 'break' ? '休息中' : '微休息中';
      await appWindow.setTitle(`FocusFlow - ${stateText}`);
    } catch (error) {
      console.error('Failed to update taskbar:', error);
    }
  };

  // 更新统计数据
  const updateStats = (state: 'focus' | 'break' | 'microBreak') => {
    setStats(prevStats => {
      const today = new Date().toLocaleDateString();
      const lastStat = prevStats[prevStats.length - 1];
      
      if (lastStat.date === today) {
        const updatedStat = {
          ...lastStat,
          [state === 'focus' ? 'focusTime' : 'breakTime']: 
            lastStat[state === 'focus' ? 'focusTime' : 'breakTime'] + 
            (state === 'focus' ? 90 : 20),
        };
        return [...prevStats.slice(0, -1), updatedStat];
      }
      
      return [...prevStats, {
        date: today,
        focusTime: state === 'focus' ? 90 : 0,
        breakTime: state === 'break' ? 20 : 0,
        efficiency: 0,
      }];
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow-lg">
          <Tabs defaultValue="timer" className="w-full">
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="timer" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>计时器</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>统计</span>
                </TabsTrigger>
                <TabsTrigger value="database" className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span>数据库</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="timer" className="p-6">
              <Timer
                onStateChange={(state) => {
                  updateTaskbarState(state);
                  updateStats(state);
                }}
              />
            </TabsContent>

            <TabsContent value="stats" className="p-6">
              <Stats dailyStats={stats} />
            </TabsContent>

            <TabsContent value="database" className="p-0">
              <DatabaseStats />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Home; 