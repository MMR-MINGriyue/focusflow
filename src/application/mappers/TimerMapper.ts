import { Timer } from '../../domain/entities/Timer';
import { TimerResponseDTO, TimerConfigDTO, TimerStateDTO } from '../dto/TimerDTO';

export class TimerMapper {
  static toDTO(timer: Timer, id: string, userId: string): TimerResponseDTO {
    const config = timer.getConfig();
    const state = timer.getState();
    
    return {
      id,
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
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static fromDTO(dto: TimerResponseDTO): Timer {
    return new Timer(
      {
        duration: dto.config.duration,
        shortBreakDuration: dto.config.shortBreakDuration,
        longBreakDuration: dto.config.longBreakDuration,
        longBreakInterval: dto.config.longBreakInterval
      },
      {
        remainingTime: dto.state.remainingTime,
        isRunning: dto.state.isRunning,
        isPaused: dto.state.isPaused,
        currentCycle: dto.state.currentCycle,
        mode: dto.state.mode
      }
    );
  }

  static toEntity(config: TimerConfigDTO, state?: Partial<TimerStateDTO>): Timer {
    return new Timer(config, state);
  }
}