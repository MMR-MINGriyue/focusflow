import * as React from 'react';
import { createRoot } from 'react-dom/client';
// import { BrowserRouter } from 'react-router-dom';
// import AppRouter from './Router';
import './index.css';

// 类型定义
type Theme = 'light' | 'dark';
interface Task {
  id: string;
  name: string;
  completed: boolean;
  createdAt: Date;
}
interface Stats {
  totalSessions: number;
  totalWorkTime: number;
  totalBreakTime: number;
  completedTasks: number;
}

// Web应用入口组件
const WebApp: React.FC = () => {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [time, setTime] = React.useState(25 * 60);
  const [isRunning, setIsRunning] = React.useState(false);
  const [mode, setMode] = React.useState<'work' | 'break'>('work');
  const [theme, setTheme] = React.useState<Theme>('light');
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = React.useState('');
  const [stats, setStats] = React.useState<Stats>({
    totalSessions: 0,
    totalWorkTime: 0,
    totalBreakTime: 0,
    completedTasks: 0
  });
  const [showSettings, setShowSettings] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  // 响应式检测
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 初始化
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
      loadData();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 加载本地存储数据
  const loadData = () => {
    const savedTasks = localStorage.getItem('focusflow-tasks');
    const savedStats = localStorage.getItem('focusflow-stats');
    const savedTheme = localStorage.getItem('focusflow-theme');

    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedStats) setStats(JSON.parse(savedStats));
    if (savedTheme) setTheme(savedTheme as Theme);
  };

  // 保存数据到本地存储
  React.useEffect(() => {
    localStorage.setItem('focusflow-tasks', JSON.stringify(tasks));
  }, [tasks]);

  React.useEffect(() => {
    localStorage.setItem('focusflow-stats', JSON.stringify(stats));
  }, [stats]);

  React.useEffect(() => {
    localStorage.setItem('focusflow-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // 计时器逻辑
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime - 1);
        
        // 更新统计
        if (mode === 'work') {
          setStats(prev => ({ ...prev, totalWorkTime: prev.totalWorkTime + 1 }));
        } else {
          setStats(prev => ({ ...prev, totalBreakTime: prev.totalBreakTime + 1 }));
        }
      }, 1000);
    } else if (time === 0) {
      // 完成一个会话
      if (mode === 'work') {
        setStats(prev => ({ ...prev, totalSessions: prev.totalSessions + 1 }));
        setMode('break');
        setTime(5 * 60);
        playNotification('工作时间结束！开始休息');
      } else {
        setMode('work');
        setTime(25 * 60);
        playNotification('休息时间结束！开始工作');
      }
      setIsRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, time, mode]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTime(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // 任务管理
  const addTask = () => {
    if (newTaskName.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        name: newTaskName.trim(),
        completed: false,
        createdAt: new Date()
      };
      setTasks([...tasks, newTask]);
      setNewTaskName('');
    }
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
    
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
      setStats(prev => ({ ...prev, completedTasks: prev.completedTasks + 1 }));
    }
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const playNotification = (message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FocusFlow', { body: message });
    }
  };

  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const themeColors = {
    light: {
      bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      card: 'rgba(255, 255, 255, 0.95)',
      text: '#2c3e50',
      work: '#ff6b6b',
      break: '#4ecdc4',
      button: '#667eea',
      accent: '#f093fb',
      shadow: 'rgba(0, 0, 0, 0.1)'
    },
    dark: {
      bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      card: 'rgba(45, 45, 68, 0.9)',
      text: '#e8e8e8',
      work: '#ff6b6b',
      break: '#4ecdc4',
      button: '#667eea',
      accent: '#f093fb',
      shadow: 'rgba(0, 0, 0, 0.3)'
    }
  };

  const colors = themeColors[theme];

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: colors.bg,
        color: colors.text,
        fontSize: '24px',
        fontWeight: '300'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px', fontSize: '48px' }}>🍅</div>
          <div>FocusFlow 启动中...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      padding: isMobile ? '10px' : '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '10px' : '20px'
      }}>
        {/* 头部 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '15px' : '0'
        }}>
          <h1 style={{
            color: colors.text,
            fontSize: isMobile ? '28px' : '36px',
            fontWeight: '700',
            margin: 0,
            textAlign: isMobile ? 'center' : 'left'
          }}>
            🍅 FocusFlow
          </h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={toggleTheme}
              style={{
                padding: '8px 16px',
                backgroundColor: colors.button,
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
            >
              {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? '深色' : '浅色'}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                padding: '8px 16px',
                backgroundColor: colors.accent,
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
            >
              📊 {showSettings ? '隐藏' : '显示'}统计
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        {showSettings && (
          <div style={{
            backgroundColor: colors.card,
            borderRadius: '20px',
            padding: isMobile ? '20px' : '30px',
            marginBottom: '20px',
            boxShadow: `0 8px 32px ${colors.shadow}`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme === 'light' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`
          }}>
            <h3 style={{
              color: colors.text,
              marginBottom: '20px',
              fontSize: isMobile ? '18px' : '22px',
              fontWeight: '600'
            }}>
              📊 统计数据
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: '15px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.work }}>
                  {stats.totalSessions}
                </div>
                <div style={{ fontSize: '12px', color: colors.text, opacity: 0.7 }}>
                  总会话
                </div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.work }}>
                  {Math.floor(stats.totalWorkTime / 60)}
                </div>
                <div style={{ fontSize: '12px', color: colors.text, opacity: 0.7 }}>
                  工作分钟
                </div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.break }}>
                  {Math.floor(stats.totalBreakTime / 60)}
                </div>
                <div style={{ fontSize: '12px', color: colors.text, opacity: 0.7 }}>
                  休息分钟
                </div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.accent }}>
                  {stats.completedTasks}
                </div>
                <div style={{ fontSize: '12px', color: colors.text, opacity: 0.7 }}>
                  完成任务
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
          gap: isMobile ? '20px' : '30px',
          alignItems: 'start'
        }}>
          {/* 左侧：计时器 */}
          <div style={{
            backgroundColor: colors.card,
            borderRadius: '20px',
            padding: isMobile ? '30px' : '40px',
            boxShadow: `0 8px 32px ${colors.shadow}`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme === 'light' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: isMobile ? '60px' : '80px',
                fontWeight: '300',
                color: colors.text,
                fontFamily: 'monospace',
                marginBottom: '10px',
                letterSpacing: '2px'
              }}>
                {formatTime(time)}
              </div>
              <div style={{
                fontSize: isMobile ? '16px' : '20px',
                color: colors.text,
                opacity: 0.8,
                marginBottom: '30px',
                fontWeight: '500'
              }}>
                {mode === 'work' ? '⏰ 工作时间' : '☕ 休息时间'}
              </div>
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  style={{
                    padding: isMobile ? '12px 30px' : '15px 40px',
                    backgroundColor: mode === 'work' ? colors.work : colors.break,
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    fontSize: isMobile ? '16px' : '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isRunning ? '⏸️ 暂停' : '▶️ 开始'}
                </button>
                <button
                  onClick={resetTimer}
                  style={{
                    padding: isMobile ? '12px 30px' : '15px 40px',
                    backgroundColor: colors.button,
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    fontSize: isMobile ? '16px' : '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  🔄 重置
                </button>
              </div>
            </div>
          </div>

          {/* 右侧：任务列表 */}
          <div style={{
            backgroundColor: colors.card,
            borderRadius: '20px',
            padding: isMobile ? '20px' : '30px',
            boxShadow: `0 8px 32px ${colors.shadow}`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme === 'light' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`
          }}>
            <h3 style={{
              color: colors.text,
              marginBottom: '20px',
              fontSize: isMobile ? '18px' : '22px',
              fontWeight: '600'
            }}>
              📝 任务列表
            </h3>

            {/* 添加新任务 */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="添加新任务..."
                style={{
                  flex: 1,
                  padding: '10px 15px',
                  borderRadius: '10px',
                  border: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                  backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.2)',
                  color: colors.text,
                  fontSize: '14px'
                }}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
              />
              <button
                onClick={addTask}
                style={{
                  padding: '10px 15px',
                  backgroundColor: colors.button,
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                ➕ 添加
              </button>
            </div>

            {/* 任务列表 */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: colors.text, opacity: 0.7 }}>
                  暂无任务，添加一个新任务开始吧！
                </div>
              ) : (
                tasks.map(task => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 15px',
                      marginBottom: '10px',
                      borderRadius: '10px',
                      backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      style={{
                        marginRight: '12px',
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        color: task.completed ? `${colors.text}80` : colors.text,
                        textDecoration: task.completed ? 'line-through' : 'none',
                        fontSize: '14px'
                      }}
                    >
                      {task.name}
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      style={{
                        padding: '5px 8px',
                        backgroundColor: 'transparent',
                        color: '#ff6b6b',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 页脚 */}
        <div style={{
          marginTop: '40px',
          textAlign: 'center',
          color: colors.text,
          opacity: 0.7,
          fontSize: '14px'
        }}>
          FocusFlow © {new Date().getFullYear()} - 专注管理，高效工作
        </div>
      </div>
    </div>
  );
};

// 渲染应用
const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);
root.render(<WebApp />);