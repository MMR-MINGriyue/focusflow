export interface DatabaseSchema {
  timers: {
    id: string;
    userId: string;
    config: {
      duration: number;
      shortBreakDuration: number;
      longBreakDuration: number;
      longBreakInterval: number;
    };
    state: {
      remainingTime: number;
      isRunning: boolean;
      isPaused: boolean;
      currentCycle: number;
      mode: 'pomodoro' | 'shortBreak' | 'longBreak';
    };
    createdAt: string;
    updatedAt: string;
  };
  tasks: {
    id: string;
    userId: string;
    title: string;
    description: string;
    priority: {
      level: 'low' | 'medium' | 'high' | 'urgent';
      order: number;
    };
    status: {
      state: 'todo' | 'in_progress' | 'completed' | 'cancelled';
      completedAt?: string;
    };
    estimatedPomodoros: number;
    actualPomodoros: number;
    tags: string[];
    projectId?: string;
    createdAt: string;
    updatedAt: string;
  };
  users: {
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
      lastActivityDate?: string;
    };
    createdAt: string;
    updatedAt: string;
  };
}

export class IndexedDBAdapter {
  private dbName = 'FocusFlowDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create timers store
        if (!db.objectStoreNames.contains('timers')) {
          const timerStore = db.createObjectStore('timers', { keyPath: 'id' });
          timerStore.createIndex('userId', 'userId', { unique: false });
          timerStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('userId', 'userId', { unique: false });
          taskStore.createIndex('projectId', 'projectId', { unique: false });
          taskStore.createIndex('status', 'status.state', { unique: false });
          taskStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create users store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
          userStore.createIndex('username', 'username', { unique: true });
        }
      };
    });
  }

  async save<T extends keyof DatabaseSchema>(
    storeName: T,
    data: DatabaseSchema[T]
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get<T extends keyof DatabaseSchema>(
    storeName: T,
    id: string
  ): Promise<DatabaseSchema[T] | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAll<T extends keyof DatabaseSchema>(
    storeName: T,
    indexName?: string,
    key?: any
  ): Promise<DatabaseSchema[T][]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request: IDBRequest<DatabaseSchema[T][]>;
      
      if (indexName && key !== undefined) {
        const index = store.index(indexName);
        request = index.getAll(key);
      } else {
        request = store.getAll();
      }

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete<T extends keyof DatabaseSchema>(
    storeName: T,
    id: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async update<T extends keyof DatabaseSchema>(
    storeName: T,
    id: string,
    updates: Partial<DatabaseSchema[T]>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const existing = await this.get(storeName, id);
    if (!existing) {
      throw new Error(`${storeName} with id ${id} not found`);
    }

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await this.save(storeName, updated);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}