/**
 * 获取任务统计用例
 * 处理获取任务统计的业务逻辑
 */

import { TaskAggregateRepository, TaskStats } from '../../domain/repositories/TaskAggregateRepository';
import { container } from '../../container/IoCContainer';

export interface GetTaskStatsInput {
  // 可以添加过滤条件，如日期范围等
  startDate?: Date;
  endDate?: Date;
}

export interface GetTaskStatsOutput extends TaskStats {
  // 可以添加额外的统计信息
  completionRateByDay?: Array<{
    date: string;
    rate: number;
  }>;
  productivityTrend?: Array<{
    date: string;
    pomodoros: number;
    completed: number;
  }>;
}

export class GetTaskStatsUseCase {
  private taskRepository: TaskAggregateRepository;

  constructor() {
    this.taskRepository = container.resolve<TaskAggregateRepository>('taskAggregateRepository');
  }

  async execute(input: GetTaskStatsInput = {}): Promise<GetTaskStatsOutput> {
    // 获取基本统计信息
    const stats = await this.taskRepository.getStats();

    // 可以根据输入参数添加额外的统计信息
    const result: GetTaskStatsOutput = { ...stats };

    // 如果提供了日期范围，可以计算特定时间段的统计信息
    if (input.startDate && input.endDate) {
      // 这里可以添加特定时间段的统计逻辑
      // 例如：completionRateByDay, productivityTrend 等
    }

    return result;
  }
}
