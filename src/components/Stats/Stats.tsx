import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface StatsProps {
  dailyStats: {
    date: string;
    focusTime: number;
    breakTime: number;
    efficiency: number;
  }[];
}

const Stats: React.FC<StatsProps> = ({ dailyStats }) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">专注统计</h2>
      
      <div className="mb-8">
        <h3 className="text-xl mb-2">每日专注时长</h3>
        <LineChart
          width={600}
          height={300}
          data={dailyStats}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="focusTime"
            name="专注时间(分钟)"
            stroke="#8884d8"
          />
          <Line
            type="monotone"
            dataKey="efficiency"
            name="效率评分"
            stroke="#82ca9d"
          />
        </LineChart>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h4 className="font-bold">今日专注</h4>
          <p className="text-2xl">
            {dailyStats[dailyStats.length - 1]?.focusTime || 0} 分钟
          </p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h4 className="font-bold">平均效率</h4>
          <p className="text-2xl">
            {Math.round(
              dailyStats.reduce((acc, curr) => acc + curr.efficiency, 0) /
                dailyStats.length
            )}%
          </p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <h4 className="font-bold">连续天数</h4>
          <p className="text-2xl">
            {dailyStats.filter(stat => stat.focusTime > 0).length} 天
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stats; 