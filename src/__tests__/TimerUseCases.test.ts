import { StartTimerUseCase } from '../application/use-cases/StartTimerUseCase';
import { PauseTimerUseCase } from '../application/use-cases/PauseTimerUseCase';
import { ResumeTimerUseCase } from '../application/use-cases/ResumeTimerUseCase';
import { ResetTimerUseCase } from '../application/use-cases/ResetTimerUseCase';
import { ITimerRepository } from '../domain/repositories/ITimerRepository';
import { IUserRepository } from '../domain/repositories/IUserRepository';
import { Timer } from '../domain/entities/Timer';
import { User } from '../domain/entities/User';

// Default timer configuration
const defaultConfig = {
  duration: 25 * 60 * 1000,
  shortBreakDuration: 5 * 60 * 1000,
  longBreakDuration: 15 * 60 * 1000,
  longBreakInterval: 4
};

// Mock repositories
class MockTimerRepository implements ITimerRepository {
  private timers: Map<string, { timer: Timer; userId: string }> = new Map();
  private activeTimers: Map<string, Timer> = new Map();

  async save(timer: Timer, userId: string): Promise<void> {
    const id = `timer_${Date.now()}_${userId}`;
    this.timers.set(id, { timer, userId });
    this.activeTimers.set(userId, timer);
  }

  async findById(id: string): Promise<Timer | null> {
    const data = this.timers.get(id);
    return data ? data.timer : null;
  }

  async findByUserId(userId: string): Promise<Timer[]> {
    return Array.from(this.timers.values())
      .filter(data => data.userId === userId)
      .map(data => data.timer);
  }

  async delete(id: string): Promise<void> {
    this.timers.delete(id);
  }

  async update(id: string, timer: Timer): Promise<void> {
    const existingTimer = Array.from(this.timers.entries()).find(([key, value]) => value.timer === timer);
    if (existingTimer) {
      this.timers.set(existingTimer[0], { timer, userId: existingTimer[1].userId });
    }
  }

  async findActiveTimer(userId: string): Promise<Timer | null> {
    return this.activeTimers.get(userId) || null;
  }

  setActiveTimer(userId: string, timer: Timer): void {
    this.activeTimers.set(userId, timer);
  }
}

class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<void> {
    this.users.set(user.getId(), user);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values()).find(user => user.getEmail() === email) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return Array.from(this.users.values()).find(user => user.getUsername() === username) || null;
  }

  async update(id: string, user: User): Promise<void> {
    this.users.set(id, user);
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.users.has(id);
  }
}

describe('Timer Use Cases', () => {
  let timerRepository: MockTimerRepository;
  let userRepository: MockUserRepository;
  let userId: string;

  beforeEach(() => {
    timerRepository = new MockTimerRepository();
    userRepository = new MockUserRepository();
    userId = 'test-user-123';
    
    // Create test user
    const user = new User(userId, 'testuser', 'test@example.com');
    userRepository.save(user);
  });

  describe('StartTimerUseCase', () => {
    it('should start a new timer successfully', async () => {
      const useCase = new StartTimerUseCase(timerRepository, userRepository);
      
      const response = await useCase.execute({ userId });
      
      expect(response.timer).toBeInstanceOf(Timer);
      expect(response.timer.getState().isRunning).toBe(true);
    });

    it('should use user preferences for timer configuration', async () => {
      const user = await userRepository.findById(userId);
      if (user) {
        user.updatePreferences({ focusDuration: 30 * 60 * 1000 });
        await userRepository.update(userId, user);
      }

      const useCase = new StartTimerUseCase(timerRepository, userRepository);
      const response = await useCase.execute({ userId });
      
      expect(response.timer.getConfig().duration).toBe(30 * 60 * 1000);
    });

    it('should use custom configuration when provided', async () => {
      const useCase = new StartTimerUseCase(timerRepository, userRepository);
      
      const response = await useCase.execute({
        userId,
        duration: 45 * 60 * 1000,
        shortBreakDuration: 10 * 60 * 1000
      });
      
      expect(response.timer.getConfig().duration).toBe(45 * 60 * 1000);
      expect(response.timer.getConfig().shortBreakDuration).toBe(10 * 60 * 1000);
    });

    it('should throw error when user does not exist', async () => {
      const useCase = new StartTimerUseCase(timerRepository, userRepository);
      
      await expect(useCase.execute({ userId: 'nonexistent' }))
        .rejects.toThrow('User not found');
    });

    it('should throw error when user already has active timer', async () => {
      const useCase = new StartTimerUseCase(timerRepository, userRepository);
      
      // Start first timer
      await useCase.execute({ userId });
      
      // Try to start second timer
      await expect(useCase.execute({ userId }))
        .rejects.toThrow('User already has an active timer');
    });
  });

  describe('PauseTimerUseCase', () => {
    it('should pause timer successfully', async () => {
      const startUseCase = new StartTimerUseCase(timerRepository, userRepository);
      const pauseUseCase = new PauseTimerUseCase(timerRepository);
      
      const { timer, timerId } = await startUseCase.execute({ userId });
      // Timer is already started by StartTimerUseCase
      
      const response = await pauseUseCase.execute({
        timerId,
        userId
      });
      
      expect(response.success).toBe(true);
      expect(response.remainingTime).toBe(timer.getState().remainingTime);
    });

    it('should throw error when timer does not exist', async () => {
      const useCase = new PauseTimerUseCase(timerRepository);
      
      await expect(useCase.execute({
        timerId: 'nonexistent',
        userId
      })).rejects.toThrow('Timer not found');
    });

    it('should throw error when timer does not belong to user', async () => {
      const useCase = new PauseTimerUseCase(timerRepository);
      
      // Create timer for different user
      const otherUserId = 'other-user-456';
      const otherUser = new User(otherUserId, 'other', 'other@example.com');
      await userRepository.save(otherUser);
      
      const startUseCase = new StartTimerUseCase(timerRepository, userRepository);
      const { timerId } = await startUseCase.execute({ userId: otherUserId });
      
      // Try to pause timer with wrong user
      await expect(useCase.execute({
        timerId,
        userId
      })).rejects.toThrow('Timer does not belong to user');
    });
  });

  describe('ResumeTimerUseCase', () => {
    it('should resume timer successfully', async () => {
      const startUseCase = new StartTimerUseCase(timerRepository, userRepository);
      const pauseUseCase = new PauseTimerUseCase(timerRepository);
      const resumeUseCase = new ResumeTimerUseCase(timerRepository);
      
      const { timer, timerId } = await startUseCase.execute({ userId });
      // Timer is already started by StartTimerUseCase
      await pauseUseCase.execute({ timerId, userId });
      
      const response = await resumeUseCase.execute({
        timerId,
        userId
      });
      
      expect(response.success).toBe(true);
    });

    it('should throw error when timer is not paused', async () => {
      const startUseCase = new StartTimerUseCase(timerRepository, userRepository);
      const resumeUseCase = new ResumeTimerUseCase(timerRepository);
      
      const { timer, timerId } = await startUseCase.execute({ userId });
      // Timer is already started by StartTimerUseCase
      
      await expect(resumeUseCase.execute({
        timerId,
        userId
      })).rejects.toThrow('Timer is not paused');
    });
  });

  describe('ResetTimerUseCase', () => {
    it('should reset timer successfully', async () => {
      const startUseCase = new StartTimerUseCase(timerRepository, userRepository);
      const resetUseCase = new ResetTimerUseCase(timerRepository);
      
      const { timer, timerId } = await startUseCase.execute({ userId });
      
      const response = await resetUseCase.execute({
        timerId,
        userId
      });
      
      expect(response.success).toBe(true);
      expect(response.newRemainingTime).toBe(defaultConfig.duration);
    });
  });
});