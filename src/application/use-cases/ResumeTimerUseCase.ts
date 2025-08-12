import { ITimerRepository } from '../../domain/repositories/ITimerRepository';

export interface ResumeTimerRequest {
  timerId: string;
  userId: string;
}

export interface ResumeTimerResponse {
  success: boolean;
  remainingTime: number;
}

export class ResumeTimerUseCase {
  constructor(private timerRepository: ITimerRepository) {}

  async execute(request: ResumeTimerRequest): Promise<ResumeTimerResponse> {
    const timer = await this.timerRepository.findById(request.timerId);
    
    if (!timer) {
      throw new Error('Timer not found');
    }

    // Verify the timer belongs to the user
    const userTimers = await this.timerRepository.findByUserId(request.userId);
    const userTimer = userTimers.find(t => 
      t.getState().remainingTime === timer.getState().remainingTime &&
      t.getState().isRunning === timer.getState().isRunning
    );

    if (!userTimer) {
      throw new Error('Timer does not belong to user');
    }

    const state = timer.getState();
    if (!state.isPaused) {
      throw new Error('Timer is not paused');
    }

    timer.resume();
    await this.timerRepository.update(request.timerId, timer);

    return {
      success: true,
      remainingTime: timer.getState().remainingTime
    };
  }
}