import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { 
 
  CheckCircle, 
  Circle, 
  Trash2, 
  Edit, 
  Clock,
  Flag,

  Search,
  Filter
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  estimatedPomodoros: number;
  actualPomodoros: number;
  createdAt: Date;
  completedAt?: Date;
  tags?: string[];
}

interface TaskManagerProps {
  className?: string;
  onTaskSelect?: (task: Task) => void;
}

/**
 * 任务管理组件
 * 帮助用户管理他们的任务列表
 */
const TaskManager: React.FC<TaskManagerProps> = ({ className = '', onTaskSelect }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskEstimatedPomodoros, setNewTaskEstimatedPomodoros] = useState(1);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  // 从本地存储加载任务
  useEffect(() => {
    const savedTasks = localStorage.getItem('focusflow-tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        // 转换日期字符串为Date对象
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined
        }));
        setTasks(tasksWithDates);
      } catch (error) {
        console.error('Failed to parse tasks from localStorage:', error);
      }
    }
  }, []);

  // 保存任务到本地存储
  useEffect(() => {
    localStorage.setItem('focusflow-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // 过滤任务
  useEffect(() => {
    let result = tasks;

    // 按搜索词过滤
    if (searchTerm) {
      result = result.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 按优先级过滤
    if (filterPriority !== 'all') {
      result = result.filter(task => task.priority === filterPriority);
    }

    // 按状态过滤
    if (filterStatus === 'active') {
      result = result.filter(task => !task.completed);
    } else if (filterStatus === 'completed') {
      result = result.filter(task => task.completed);
    }

    // 按创建时间排序（最新的在前）
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    setFilteredTasks(result);
  }, [tasks, searchTerm, filterPriority, filterStatus]);

  // 添加新任务
  const addTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      completed: false,
      priority: newTaskPriority,
      estimatedPomodoros: newTaskEstimatedPomodoros,
      actualPomodoros: 0,
      createdAt: new Date()
    };

    setTasks([...tasks, newTask]);

    // 重置表单
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setNewTaskEstimatedPomodoros(1);
  };

  // 删除任务
  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // 切换任务完成状态
  const toggleTaskCompletion = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        return {
          ...task,
          completed: !task.completed,
          completedAt: task.completed ? undefined : new Date()
        };
      }
      return task;
    }));
  };

  // 开始编辑任务
  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskDescription(task.description || '');
    setNewTaskPriority(task.priority);
    setNewTaskEstimatedPomodoros(task.estimatedPomodoros);
  };

  // 保存编辑
  const saveEdit = () => {
    if (!editingTaskId || !newTaskTitle.trim()) return;

    setTasks(tasks.map(task => {
      if (task.id === editingTaskId) {
        return {
          ...task,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || undefined,
          priority: newTaskPriority,
          estimatedPomodoros: newTaskEstimatedPomodoros
        };
      }
      return task;
    }));

    // 重置编辑状态
    setEditingTaskId(null);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setNewTaskEstimatedPomodoros(1);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingTaskId(null);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskPriority('medium');
    setNewTaskEstimatedPomodoros(1);
  };

  // 增加实际番茄数
  const incrementActualPomodoros = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id && !task.completed) {
        return {
          ...task,
          actualPomodoros: Math.min(task.actualPomodoros + 1, task.estimatedPomodoros * 2) // 限制最大值为估计值的两倍
        };
      }
      return task;
    }));
  };

  // 减少实际番茄数
  const decrementActualPomodoros = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id && !task.completed && task.actualPomodoros > 0) {
        return {
          ...task,
          actualPomodoros: task.actualPomodoros - 1
        };
      }
      return task;
    }));
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // 获取优先级文本
  const getPriorityText = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '中';
    }
  };

  // 计算任务统计
  const calculateStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const activeTasks = totalTasks - completedTasks;

    const totalEstimatedPomodoros = tasks.reduce((sum, task) => sum + task.estimatedPomodoros, 0);
    const totalActualPomodoros = tasks.reduce((sum, task) => sum + task.actualPomodoros, 0);

    return {
      totalTasks,
      completedTasks,
      activeTasks,
      totalEstimatedPomodoros,
      totalActualPomodoros,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };

  const stats = calculateStats();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 任务统计 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalTasks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">总任务</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">已完成</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.activeTasks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">进行中</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalEstimatedPomodoros}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">预计番茄</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.completionRate}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">完成率</div>
          </CardContent>
        </Card>
      </div>

      {/* 添加/编辑任务表单 */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingTaskId ? '编辑任务' : '添加新任务'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                任务标题 *
              </label>
              <Input
                value={newTaskTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskTitle(e.target.value)}
                placeholder="输入任务标题"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                优先级
              </label>
              <div className="flex space-x-2">
                {(['low', 'medium', 'high'] as const).map(priority => (
                  <Button
                    key={priority}
                    variant={newTaskPriority === priority ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewTaskPriority(priority)}
                    className="flex-1"
                  >
                    {getPriorityText(priority)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              任务描述
            </label>
            <Input
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="输入任务描述（可选）"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              预计番茄数
            </label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewTaskEstimatedPomodoros(Math.max(1, newTaskEstimatedPomodoros - 1))}
                disabled={newTaskEstimatedPomodoros <= 1}
              >
                -
              </Button>
              <div className="w-12 text-center font-medium">
                {newTaskEstimatedPomodoros}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewTaskEstimatedPomodoros(newTaskEstimatedPomodoros + 1)}
              >
                +
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                番茄
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            {editingTaskId && (
              <Button variant="outline" onClick={cancelEdit}>
                取消
              </Button>
            )}
            <Button onClick={editingTaskId ? saveEdit : addTask}>
              {editingTaskId ? '保存更改' : '添加任务'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>任务列表</CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索任务..."
                  className="pl-10 w-48"
                />
              </div>

              <div className="flex space-x-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    aria-label="按状态筛选任务"
                  >
                    <option value="all">所有状态</option>
                    <option value="active">进行中</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>

                <div className="relative">
                  <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as any)}
                    className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    aria-label="按优先级筛选任务"
                  >
                    <option value="all">所有优先级</option>
                    <option value="high">高优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="low">低优先级</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">暂无任务</div>
              <div className="text-sm text-gray-500">
                {searchTerm || filterPriority !== 'all' || filterStatus !== 'all'
                  ? '没有找到匹配的任务'
                  : '添加您的第一个任务开始使用'}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg flex items-start ${
                    task.completed
                      ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <button
                    onClick={() => toggleTaskCompletion(task.id)}
                    className="mr-3 mt-1"
                  >
                    {task.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className={`font-medium ${
                        task.completed
                          ? 'text-gray-500 dark:text-gray-400 line-through'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {task.title}
                      </h3>

                      <div className="flex space-x-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {getPriorityText(task.priority)}
                        </Badge>

                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>
                            {task.actualPomodoros}/{task.estimatedPomodoros}
                          </span>
                        </div>
                      </div>
                    </div>

                    {task.description && (
                      <p className={`mt-1 text-sm ${
                        task.completed
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {task.description}
                      </p>
                    )}

                    <div className="mt-2 flex items-center space-x-2">
                      {!task.completed && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => decrementActualPomodoros(task.id)}
                            disabled={task.actualPomodoros <= 0}
                          >
                            -
                          </Button>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            番茄: {task.actualPomodoros}/{task.estimatedPomodoros}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => incrementActualPomodoros(task.id)}
                            disabled={task.actualPomodoros >= task.estimatedPomodoros * 2}
                          >
                            +
                          </Button>
                        </>
                      )}

                      <div className="flex-1"></div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTaskSelect?.(task)}
                      >
                        开始专注
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(task)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskManager;
