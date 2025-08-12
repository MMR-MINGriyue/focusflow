export class EfficiencyScore {
  private readonly score: number; // 0-100

  constructor(score: number) {
    if (score < 0 || score > 100) {
      throw new Error('Efficiency score must be between 0 and 100');
    }
    this.score = Math.round(score);
  }

  static fromMetrics(
    completedPomodoros: number,
    estimatedPomodoros: number,
    actualTime: number,
    estimatedTime: number
  ): EfficiencyScore {
    if (estimatedPomodoros === 0 || estimatedTime === 0) {
      return new EfficiencyScore(0);
    }

    const pomodoroAccuracy = Math.min(completedPomodoros / estimatedPomodoros, 1);
    const timeAccuracy = Math.min(estimatedTime / actualTime, 1);
    
    // Weight: 60% pomodoro accuracy, 40% time accuracy
    const score = (pomodoroAccuracy * 0.6 + timeAccuracy * 0.4) * 100;
    
    return new EfficiencyScore(score);
  }

  static fromFocusRatio(focusTime: number, totalTime: number): EfficiencyScore {
    if (totalTime === 0) return new EfficiencyScore(0);
    
    const ratio = focusTime / totalTime;
    return new EfficiencyScore(ratio * 100);
  }

  getValue(): number {
    return this.score;
  }

  getGrade(): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (this.score >= 90) return 'A';
    if (this.score >= 80) return 'B';
    if (this.score >= 70) return 'C';
    if (this.score >= 60) return 'D';
    return 'F';
  }

  getDescription(): string {
    if (this.score >= 90) return 'Excellent';
    if (this.score >= 80) return 'Very Good';
    if (this.score >= 70) return 'Good';
    if (this.score >= 60) return 'Fair';
    return 'Needs Improvement';
  }

  isExcellent(): boolean {
    return this.score >= 90;
  }

  isGood(): boolean {
    return this.score >= 70;
  }

  isPoor(): boolean {
    return this.score < 60;
  }

  add(other: EfficiencyScore): EfficiencyScore {
    return new EfficiencyScore(Math.min(this.score + other.score, 100));
  }

  subtract(other: EfficiencyScore): EfficiencyScore {
    return new EfficiencyScore(Math.max(this.score - other.score, 0));
  }

  average(other: EfficiencyScore): EfficiencyScore {
    return new EfficiencyScore(Math.round((this.score + other.score) / 2));
  }

  toString(): string {
    return `${this.score}% (${this.getGrade()})`;
  }
}