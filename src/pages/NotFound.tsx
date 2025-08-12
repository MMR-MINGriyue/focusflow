import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home, Search, AlertCircle } from 'lucide-react';

/**
 * 404页面组件
 * 用于处理未找到的路由
 */
const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex items-center justify-center">
      <div className="max-w-md w-full text-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">页面未找到</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            抱歉，您访问的页面不存在。请检查URL是否正确，或返回首页。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/" className="flex items-center">
                <Home className="w-4 h-4 mr-2" />
                返回首页
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link to="/help" className="flex items-center">
                <Search className="w-4 h-4 mr-2" />
                查找帮助
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            如果您认为这是一个错误，请<a href="mailto:support@focusflow.app" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">联系我们</a>。
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
