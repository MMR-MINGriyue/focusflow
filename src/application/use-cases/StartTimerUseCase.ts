import { Timer } from '../../domain/entities/Timer';
import { ITimerRepository } from '../../domain/repositories/ITimerRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export interface StartTimerRequest {
  userId: string;
  duration?: number;
  shortBreakDuration?: number;
  longBreakDuration?: number;
  longBreakInterval?: number;
}

export interface StartTimerResponse {
  timerId: string;
  timer: Timer;
}

export class StartTimerUseCase {
  constructor(
    private timerRepository: ITimerRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(request: StartTimerRequest): Promise<StartTimerResponse> {
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has an active timer
    const activeTimer = await this.timerRepository.findActiveTimer(request.userId);
    if (activeTimer) {
      throw new Error('User already has an active timer');
    }

    const userConfig = user.getTimerConfig();
    
    const timer = new Timer({
      duration: request.duration || userConfig.duration,
      shortBreakDuration: request.shortBreakDuration || userConfig.shortBreakDuration,
      longBreakDuration: request.longBreakDuration || userConfig.longBreakDuration,
      longBreakInterval: request.longBreakInterval || userConfig.longBreakInterval
    });

    // Start the timer immediately
    timer.start();

    const timerId = `timer_${Date.now()}_${request.userId}`;
    await this.timerRepository.save(timer, request.userId);

    return {
      timerId,
      timer
    };
  }
}