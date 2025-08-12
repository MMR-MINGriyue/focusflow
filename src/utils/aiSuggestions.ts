// AI驱动的智能建议系统
import { getStorageService } from '../services/storage';

interface UsagePattern {
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  dailySessions: number;
  weeklyTotal: number;
  peakHours: number[];
  consistency: number; // 0-100
}

export interface AIRecommendation {
  type: 'productivity' | 'health' | 'efficiency' | 'break';
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: number; // 百分比提升
}

class AISuggestionEngine {
  private static instance: AISuggestionEngine;
  private usageHistory: UsagePattern[] = [];
  private recommendations: AIRecommendation[] = [];

  static getInstance(): AISuggestionEngine {
    if (!AISuggestionEngine.instance) {
      AISuggestionEngine.instance = new AISuggestionEngine();
    }
    return AISuggestionEngine.instance;
  }

  async initialize(): Promise<void> {
    await this.loadUsageHistory();
    await this.generateRecommendations();
  }

  private async loadUsageHistory(): Promise<void> {
    try {
      const storage = getStorageService();
      const history = await storage.get('ai_usage_history');
      this.usageHistory = history || [];
    } catch (error) {
      console.warn('Failed to load usage history:', error);
      this.usageHistory = [];
    }
  }

  private async saveUsageHistory(): Promise<void> {
    try {
      const storage = getStorageService();
      await storage.set('ai_usage_history', this.usageHistory);
    } catch (error) {
      console.warn('Failed to save usage history:', error);
    }
  }

  async recordSession(duration: number, type: 'focus' | 'break' | 'longBreak'): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();
    
    // 更新当前使用模式
    const currentPattern: UsagePattern = {
      focusDuration: type === 'focus' ? duration : 0,
      breakDuration: type === 'break' ? duration : 0,
      longBreakDuration: type === 'longBreak' ? duration : 0,
      dailySessions: 1,
      weeklyTotal: 1,
      peakHours: [currentHour],
      consistency: this.calculateConsistency(),
    };

    this.usageHistory.push(currentPattern);
    
    // 保持历史记录在合理范围内
    if (this.usageHistory.length > 1000) {
      this.usageHistory = this.usageHistory.slice(-1000);
    }

    await this.saveUsageHistory();
    await this.generateRecommendations();
  }

  private calculateConsistency(): number {
    if (this.usageHistory.length < 7) return 50;

    const last7Days = this.usageHistory.slice(-7);
    const dailySessions = last7Days.map(p => p.dailySessions);
    const avg = dailySessions.reduce((a, b) => a + b, 0) / dailySessions.length;
    const variance = dailySessions.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / dailySessions.length;
    const consistency = Math.max(0, 100 - (variance * 10));
    
    return Math.min(100, consistency);
  }

  async generateRecommendations(_currentSettings?: { focusDuration?: number; breakDuration?: number; longBreakDuration?: number }): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // 基于使用模式生成建议
    const recentPattern = this.getRecentPattern();
    
    // 生产力建议
    if (recentPattern.focusDuration < 25) {
      recommendations.push({
        type: 'productivity',
        title: '延长专注时间',
        description: '您的专注时间较短，建议逐步增加到25分钟以获得更好的深度工作效果',
        action: '将专注时长调整为25分钟',
        priority: 'medium',
        estimatedImpact: 15
      });
    }

    // 健康建议
    if (recentPattern.dailySessions > 8) {
      recommendations.push({
        type: 'health',
        title: '避免过度工作',
        description: '您今天的会话数量较多，建议适当休息，避免疲劳',
        action: '安排一个长休息',
        priority: 'high',
        estimatedImpact: 20
      });
    }

    // 效率建议
    if (recentPattern.consistency < 70) {
      recommendations.push({
        type: 'efficiency',
        title: '建立工作规律',
        description: '您的使用模式不够规律，建议固定时间工作以提高效率',
        action: '设置每日提醒',
        priority: 'medium',
        estimatedImpact: 25
      });
    }

    // 休息建议
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour >= 14 && currentHour <= 16) {
      recommendations.push({
        type: 'break',
        title: '午后休息',
        description: '下午2-4点是人体自然的低谷期，建议安排短暂休息',
        action: '开始5分钟微休息',
        priority: 'medium',
        estimatedImpact: 10
      });
    }

    this.recommendations = recommendations;
    return recommendations;
  }

  private getRecentPattern(): UsagePattern {
    if (this.usageHistory.length === 0) {
      return {
        focusDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        dailySessions: 0,
        weeklyTotal: 0,
        peakHours: [9, 14, 19],
        consistency: 50
      };
    }

    const recent = this.usageHistory.slice(-7);
    return {
      focusDuration: Math.round(recent.reduce((a, b) => a + b.focusDuration, 0) / recent.length),
      breakDuration: Math.round(recent.reduce((a, b) => a + b.breakDuration, 0) / recent.length),
      longBreakDuration: Math.round(recent.reduce((a, b) => a + b.longBreakDuration, 0) / recent.length),
      dailySessions: Math.round(recent.reduce((a, b) => a + b.dailySessions, 0) / recent.length),
      weeklyTotal: recent.reduce((a, b) => a + b.weeklyTotal, 0),
      peakHours: this.calculatePeakHours(recent),
      consistency: this.calculateConsistency()
    };
  }

  private calculatePeakHours(recent: UsagePattern[]): number[] {
    const hourCounts: { [key: number]: number } = {};
    
    recent.forEach(pattern => {
      pattern.peakHours.forEach(hour => {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
    });

    return Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  getRecommendations(): AIRecommendation[] {
    return this.recommendations;
  }

  async applyRecommendation(recommendation: AIRecommendation): Promise<{type: string; value?: any}> {
    let configChange: {type: string; value?: any} = {type: 'none'};
    
    switch (recommendation.type) {
      case 'productivity':
        if (recommendation.action.includes('25分钟')) {
          configChange = {type: 'setFocusDuration', value: 25};
        }
        break;
      case 'break':
        if (recommendation.action.includes('5分钟')) {
          configChange = {type: 'setMicroBreakDuration', value: 5};
        }
        break;
      case 'health':
        configChange = {type: 'startLongBreak'};
        break;
    }

    // 记录建议被采纳
    await this.recordRecommendationUsage(recommendation);
    return configChange;
  }

  private async recordRecommendationUsage(recommendation: AIRecommendation): Promise<void> {
    const usage = {
      recommendation: recommendation.title,
      timestamp: new Date().toISOString(),
      type: recommendation.type
    };

    const storage = getStorageService();
    const history = await storage.get('ai_recommendation_usage') || [];
    history.push(usage);
    
    if (history.length > 100) {
      history.shift();
    }

    await storage.set('ai_recommendation_usage', history);
  }

  // 获取个性化洞察
  getInsights(): string[] {
    const pattern = this.getRecentPattern();
    const insights: string[] = [];

    if (pattern.consistency > 80) {
      insights.push('您的工作习惯非常规律，这有助于保持高效状态');
    }

    if (pattern.peakHours.includes(9)) {
      insights.push('上午9点是您的黄金工作时间');
    }

    if (pattern.weeklyTotal > 20) {
      insights.push('您本周的专注时间超过平均水平');
    }

    return insights;
  }

  async getUsageStats(): Promise<any> {
    const pattern = this.getRecentPattern();
    return {
      totalSessions: this.usageHistory.length,
      averageFocusDuration: pattern.focusDuration,
      productivityScore: Math.round(pattern.consistency),
      peakHourStart: pattern.peakHours[0] || 9,
      peakHourEnd: (pattern.peakHours[0] || 9) + 2,
      insights: this.getInsights()
    };
  }

  async clearData(): Promise<void> {
    this.usageHistory = [];
    this.recommendations = [];
    const storage = getStorageService();
    await storage.set('ai_usage_history', []);
    await storage.set('ai_recommendation_usage', []);
  }


}

export const aiSuggestions = AISuggestionEngine.getInstance();