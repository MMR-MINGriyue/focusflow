import { ITimerRepository } from '../../domain/repositories/ITimerRepository';

export interface ResetTimerRequest {
  timerId: string;
  userId: string;
}

export interface ResetTimerResponse {
  success: boolean;
  newRemainingTime: number;
}

export class ResetTimerUseCase {
  constructor(private timerRepository: ITimerRepository) {}

  async execute(request: ResetTimerRequest): Promise<ResetTimerResponse> {
    const timer = await this.timerRepository.findById(request.timerId);
    
    if (!timer) {
      throw new Error('Timer not found');
    }

    // Verify the timer belongs to the user
    const userTimers = await this.timerRepository.findByUserId(request.userId);
    const userTimer = userTimers.find(t => 
      t.getState().remainingTime === timer.getState().remainingTime
    );

    if (!userTimer) {
      throw new Error('Timer does not belong to user');
    }

    timer.reset();
    await this.timerRepository.update(request.timerId, timer);

    return {
      success: true,
      newRemainingTime: timer.getState().remainingTime
    };
  }
}