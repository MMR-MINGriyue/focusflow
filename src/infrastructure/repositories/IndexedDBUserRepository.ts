import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IndexedDBAdapter } from '../storage/IndexedDBAdapter';

export class IndexedDBUserRepository implements IUserRepository {
  private dbAdapter: IndexedDBAdapter;

  constructor(dbAdapter: IndexedDBAdapter) {
    this.dbAdapter = dbAdapter;
  }

  async save(user: User): Promise<void> {
    const userData = {
      id: user.getId(),
      username: user.getUsername(),
      email: user.getEmail(),
      preferences: user.getPreferences(),
      statistics: {
        totalPomodorosCompleted: user.getStatistics().totalPomodorosCompleted,
        totalFocusTime: user.getStatistics().totalFocusTime,
        totalBreakTime: user.getStatistics().totalBreakTime,
        currentStreak: user.getStatistics().currentStreak,
        longestStreak: user.getStatistics().longestStreak,
        lastActivityDate: user.getStatistics().lastActivityDate?.toISOString()
      },
      createdAt: user.getCreatedAt().toISOString(),
      updatedAt: user.getUpdatedAt().toISOString()
    };

    await this.dbAdapter.save('users', userData);
  }

  async findById(id: string): Promise<User | null> {
    const data = await this.dbAdapter.get('users', id);
    if (!data) return null;

    const user = new User(
      data.id,
      data.username,
      data.email,
      data.preferences
    );

    // Restore statistics
    const stats = user.getStatistics();
    stats.totalPomodorosCompleted = data.statistics.totalPomodorosCompleted;
    stats.totalFocusTime = data.statistics.totalFocusTime;
    stats.totalBreakTime = data.statistics.totalBreakTime;
    stats.currentStreak = data.statistics.currentStreak;
    stats.longestStreak = data.statistics.longestStreak;
    stats.lastActivityDate = data.statistics.lastActivityDate 
      ? new Date(data.statistics.lastActivityDate) 
      : undefined;

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.dbAdapter.getAll('users', 'email', email);
    if (users.length === 0) return null;
    
    return this.findById(users[0].id);
  }

  async findByUsername(username: string): Promise<User | null> {
    const users = await this.dbAdapter.getAll('users', 'username', username);
    if (users.length === 0) return null;
    
    return this.findById(users[0].id);
  }

  async update(id: string, user: User): Promise<void> {
    const updates = {
      username: user.getUsername(),
      email: user.getEmail(),
      preferences: user.getPreferences(),
      statistics: {
        totalPomodorosCompleted: user.getStatistics().totalPomodorosCompleted,
        totalFocusTime: user.getStatistics().totalFocusTime,
        totalBreakTime: user.getStatistics().totalBreakTime,
        currentStreak: user.getStatistics().currentStreak,
        longestStreak: user.getStatistics().longestStreak,
        lastActivityDate: user.getStatistics().lastActivityDate?.toISOString()
      }
    };

    await this.dbAdapter.update('users', id, updates);
  }

  async delete(id: string): Promise<void> {
    await this.dbAdapter.delete('users', id);
  }

  async exists(id: string): Promise<boolean> {
    const user = await this.findById(id);
    return user !== null;
  }
}