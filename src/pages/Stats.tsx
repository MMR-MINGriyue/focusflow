import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Stats from '../components/Stats/Stats';

const StatsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link to="/" className="flex items-center text-primary hover:text-primary/80">
            <ArrowLeft className="h-5 w-5 mr-2" />
            返回
          </Link>
          <h1 className="text-2xl font-bold ml-4">数据统计</h1>
        </div>
        <Stats />
      </div>
    </div>
  );
};

export default StatsPage;