import React, { useState, useEffect } from 'react';
import { aiSuggestions, AIRecommendation } from '../utils/aiSuggestions';


interface AIRecommendationsProps {
  className?: string;
  onRecommendationClick?: (recommendation: AIRecommendation) => void;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({
  className = '',
  onRecommendationClick
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);

  useEffect(() => {
    initializeAI();
  }, []);

  const initializeAI = async () => {
    try {
      setIsLoading(true);
      await aiSuggestions.initialize();
      await refreshRecommendations();
    } catch (error) {
      console.error('Failed to initialize AI suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    const newRecommendations = await aiSuggestions.generateRecommendations();
    const newInsights = aiSuggestions.getInsights();
    setRecommendations(newRecommendations);
    setInsights(newInsights);
  };

  const handleApplyRecommendation = async (recommendation: AIRecommendation) => {
    try {
      await aiSuggestions.applyRecommendation(recommendation);
      if (onRecommendationClick) {
        onRecommendationClick(recommendation);
      }
      
      // 应用后刷新建议
      setTimeout(async () => {
        await refreshRecommendations();
      }, 100);
    } catch (error) {
      console.error('Failed to apply recommendation:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'productivity': return '🚀';
      case 'health': return '❤️';
      case 'efficiency': return '⚡';
      case 'break': return '☕';
      default: return '💡';
    }
  };

  if (isLoading) {
    return (
      <div className={`p-6 rounded-lg bg-white dark:bg-gray-800 shadow-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg bg-white dark:bg-gray-800 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          🤖 AI智能建议
        </h3>
        <button
          onClick={refreshRecommendations}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          刷新
        </button>
      </div>

      {/* 个性化洞察 */}
      {insights.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            📊 个性化洞察
          </h4>
          <ul className="space-y-1">
            {insights.map((insight, index) => (
              <li key={index} className="text-xs text-blue-700 dark:text-blue-300">
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 建议列表 */}
      <div className="space-y-3">
        {recommendations.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            暂无建议，继续使用以获得个性化建议
          </p>
        ) : (
          recommendations.map((recommendation, index) => (
            <div
              key={`${recommendation.type}-${index}`}
              className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                getPriorityColor(recommendation.priority)
              } ${
                expandedRecommendation === `${recommendation.type}-${index}`
                  ? 'ring-2 ring-opacity-50'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getTypeIcon(recommendation.type)}</span>
                    <h4 className="font-medium text-sm">{recommendation.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
                      recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {recommendation.priority}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {recommendation.description}
                  </p>

                  {expandedRecommendation === `${recommendation.type}-${index}` && (
                    <div className="mt-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded text-xs">
                      <p className="text-gray-600 dark:text-gray-400">
                        预期效果：提升{recommendation.estimatedImpact}%效率
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        操作：{recommendation.action}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 ml-3">
                  <button
                    onClick={() => handleApplyRecommendation(recommendation)}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    应用
                  </button>
                  <button
                    onClick={() => setExpandedRecommendation(
                      expandedRecommendation === `${recommendation.type}-${index}` 
                        ? null 
                        : `${recommendation.type}-${index}`
                    )}
                    className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                  >
                    {expandedRecommendation === `${recommendation.type}-${index}` ? '收起' : '详情'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 使用统计 */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>基于{recommendations.length}条分析</span>
          <span>数据驱动建议</span>
        </div>
      </div>
    </div>
  );
};