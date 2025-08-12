import { User } from '../entities/User';

export interface UserData {
  id: string;
  username: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    longBreakInterval: number;
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
  };
  statistics: {
    totalPomodorosCompleted: number;
    totalFocusTime: number;
    totalBreakTime: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  update(id: string, user: User): Promise<void>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}