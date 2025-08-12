import { Timer } from '../../domain/entities/Timer';
import { ITimerRepository } from '../../domain/repositories/ITimerRepository';
import { IndexedDBAdapter } from '../storage/IndexedDBAdapter';

export class IndexedDBTimerRepository implements ITimerRepository {
  private dbAdapter: IndexedDBAdapter;

  constructor(dbAdapter: IndexedDBAdapter) {
    this.dbAdapter = dbAdapter;
  }

  async save(timer: Timer, userId: string): Promise<void> {
    const state = timer.getState();
    const config = timer.getConfig();
    
    const timerData = {
      id: `timer_${Date.now()}_${userId}`,
      userId,
      config: {
        duration: config.duration,
        shortBreakDuration: config.shortBreakDuration,
        longBreakDuration: config.longBreakDuration,
        longBreakInterval: config.longBreakInterval
      },
      state: {
        remainingTime: state.remainingTime,
        isRunning: state.isRunning,
        isPaused: state.isPaused,
        currentCycle: state.currentCycle,
        mode: state.mode
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.dbAdapter.save('timers', timerData);
  }

  async findById(id: string): Promise<Timer | null> {
    const data = await this.dbAdapter.get('timers', id);
    if (!data) return null;

    const timer = new Timer(
      {
        duration: data.config.duration,
        shortBreakDuration: data.config.shortBreakDuration,
        longBreakDuration: data.config.longBreakDuration,
        longBreakInterval: data.config.longBreakInterval
      },
      {
        remainingTime: data.state.remainingTime,
        isRunning: data.state.isRunning,
        isPaused: data.state.isPaused,
        currentCycle: data.state.currentCycle,
        mode: data.state.mode
      }
    );

    return timer;
  }

  async findByUserId(userId: string): Promise<Timer[]> {
    const dataList = await this.dbAdapter.getAll('timers', 'userId', userId);
    
    return dataList.map(data => 
      new Timer(
        {
          duration: data.config.duration,
          shortBreakDuration: data.config.shortBreakDuration,
          longBreakDuration: data.config.longBreakDuration,
          longBreakInterval: data.config.longBreakInterval
        },
        {
          remainingTime: data.state.remainingTime,
          isRunning: data.state.isRunning,
          isPaused: data.state.isPaused,
          currentCycle: data.state.currentCycle,
          mode: data.state.mode
        }
      )
    );
  }

  async delete(id: string): Promise<void> {
    await this.dbAdapter.delete('timers', id);
  }

  async update(id: string, timer: Timer): Promise<void> {
    const state = timer.getState();
    const config = timer.getConfig();
    
    const updates = {
      config: {
        duration: config.duration,
        shortBreakDuration: config.shortBreakDuration,
        longBreakDuration: config.longBreakDuration,
        longBreakInterval: config.longBreakInterval
      },
      state: {
        remainingTime: state.remainingTime,
        isRunning: state.isRunning,
        isPaused: state.isPaused,
        currentCycle: state.currentCycle,
        mode: state.mode
      }
    };

    await this.dbAdapter.update('timers', id, updates);
  }

  async findActiveTimer(userId: string): Promise<Timer | null> {
    const timers = await this.findByUserId(userId);
    const activeTimer = timers.find(timer => timer.getState().isRunning);
    
    return activeTimer || null;
  }
}