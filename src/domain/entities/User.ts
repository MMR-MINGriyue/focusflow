export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  longBreakInterval: number;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
}

export interface UserStatistics {
  totalPomodorosCompleted: number;
  totalFocusTime: number;
  totalBreakTime: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: Date;
}

export class User {
  private id: string;
  private username: string;
  private email: string;
  private preferences: UserPreferences;
  private statistics: UserStatistics;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: string,
    username: string,
    email: string,
    preferences?: Partial<UserPreferences>
  ) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.preferences = {
      theme: 'light',
      soundEnabled: true,
      notificationsEnabled: true,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      longBreakInterval: 4,
      focusDuration: 25 * 60 * 1000, // 25 minutes in milliseconds
      shortBreakDuration: 5 * 60 * 1000, // 5 minutes in milliseconds
      longBreakDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
      ...preferences
    };
    this.statistics = {
      totalPomodorosCompleted: 0,
      totalFocusTime: 0,
      totalBreakTime: 0,
      currentStreak: 0,
      longestStreak: 0
    };
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.updatedAt = new Date();
  }

  updateEmail(email: string): void {
    this.email = email;
    this.updatedAt = new Date();
  }

  updateUsername(username: string): void {
    this.username = username;
    this.updatedAt = new Date();
  }

  incrementPomodorosCompleted(): void {
    this.statistics.totalPomodorosCompleted++;
    this.updateStreak();
    this.updatedAt = new Date();
  }

  addFocusTime(duration: number): void {
    this.statistics.totalFocusTime += duration;
    this.updatedAt = new Date();
  }

  addBreakTime(duration: number): void {
    this.statistics.totalBreakTime += duration;
    this.updatedAt = new Date();
  }

  private updateStreak(): void {
    const today = new Date().toDateString();
    const lastActivity = this.statistics.lastActivityDate?.toDateString();
    
    if (lastActivity === today) {
      // Already counted for today
      return;
    }
    
    if (lastActivity && new Date(lastActivity).getDate() === new Date().getDate() - 1) {
      // Consecutive day
      this.statistics.currentStreak++;
    } else {
      // New streak
      this.statistics.currentStreak = 1;
    }
    
    this.statistics.lastActivityDate = new Date();
    this.statistics.longestStreak = Math.max(
      this.statistics.longestStreak,
      this.statistics.currentStreak
    );
  }

  resetStreak(): void {
    this.statistics.currentStreak = 0;
    this.updatedAt = new Date();
  }

  getId(): string {
    return this.id;
  }

  getUsername(): string {
    return this.username;
  }

  getEmail(): string {
    return this.email;
  }

  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  getStatistics(): UserStatistics {
    return { ...this.statistics };
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getTimerConfig() {
    return {
      duration: this.preferences.focusDuration,
      shortBreakDuration: this.preferences.shortBreakDuration,
      longBreakDuration: this.preferences.longBreakDuration,
      longBreakInterval: this.preferences.longBreakInterval
    };
  }

  getDailyGoalProgress(): number {
    // Assuming daily goal is 8 pomodoros
    const dailyGoal = 8;
    const today = new Date().toDateString();
    const lastActivity = this.statistics.lastActivityDate?.toDateString();
    
    if (lastActivity !== today) {
      return 0;
    }
    
    return Math.min(this.statistics.currentStreak / dailyGoal, 1);
  }

  getWeeklyFocusHours(): number {
    return Math.floor(this.statistics.totalFocusTime / (1000 * 60 * 60));
  }

  getProductivityScore(): number {
    const totalTime = this.statistics.totalFocusTime + this.statistics.totalBreakTime;
    if (totalTime === 0) return 0;
    
    const focusRatio = this.statistics.totalFocusTime / totalTime;
    const pomodoroEfficiency = Math.min(
      this.statistics.totalPomodorosCompleted / 100,
      1
    );
    
    return Math.floor((focusRatio * 0.7 + pomodoroEfficiency * 0.3) * 100);
  }
}