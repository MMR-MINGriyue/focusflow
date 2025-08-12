/**
 * 删除任务用例
 * 处理删除任务的业务逻辑
 */

import { TaskAggregateRepository } from '../../domain/repositories/TaskAggregateRepository';
import { TaskId } from '../../domain/value-objects/TaskId';
import { container } from '../../container/IoCContainer';

export interface DeleteTaskInput {
  id: string;
}

export interface DeleteTaskOutput {
  success: boolean;
  taskId: string;
}

export class DeleteTaskUseCase {
  private taskRepository: TaskAggregateRepository;

  constructor() {
    this.taskRepository = container.resolve<TaskAggregateRepository>('taskAggregateRepository');
  }

  async execute(input: DeleteTaskInput): Promise<DeleteTaskOutput> {
    // 验证输入
    if (!input.id) {
      throw new Error('Task ID is required');
    }

    // 查找任务
    const task = await this.taskRepository.findById(new TaskId(input.id));
    if (!task) {
      throw new Error(`Task with ID ${input.id} not found`);
    }

    // 删除任务
    await this.taskRepository.delete(task);

    // 返回结果
    return {
      success: true,
      taskId: input.id,
    };
  }
}
