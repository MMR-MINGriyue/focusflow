export class TimeDuration {
  private readonly milliseconds: number;

  constructor(milliseconds: number) {
    if (milliseconds < 0) {
      throw new Error('Duration cannot be negative');
    }
    this.milliseconds = milliseconds;
  }

  static fromMinutes(minutes: number): TimeDuration {
    return new TimeDuration(minutes * 60 * 1000);
  }

  static fromSeconds(seconds: number): TimeDuration {
    return new TimeDuration(seconds * 1000);
  }

  static fromHours(hours: number): TimeDuration {
    return new TimeDuration(hours * 60 * 60 * 1000);
  }

  toMilliseconds(): number {
    return this.milliseconds;
  }

  toSeconds(): number {
    return Math.floor(this.milliseconds / 1000);
  }

  toMinutes(): number {
    return Math.floor(this.milliseconds / (60 * 1000));
  }

  toHours(): number {
    return Math.floor(this.milliseconds / (60 * 60 * 1000));
  }

  toFormattedString(): string {
    const hours = this.toHours();
    const minutes = this.toMinutes() % 60;
    const seconds = this.toSeconds() % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  add(other: TimeDuration): TimeDuration {
    return new TimeDuration(this.milliseconds + other.milliseconds);
  }

  subtract(other: TimeDuration): TimeDuration {
    return new TimeDuration(Math.max(0, this.milliseconds - other.milliseconds));
  }

  multiply(factor: number): TimeDuration {
    return new TimeDuration(this.milliseconds * factor);
  }

  divide(divisor: number): TimeDuration {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return new TimeDuration(Math.floor(this.milliseconds / divisor));
  }

  isGreaterThan(other: TimeDuration): boolean {
    return this.milliseconds > other.milliseconds;
  }

  isLessThan(other: TimeDuration): boolean {
    return this.milliseconds < other.milliseconds;
  }

  isEqualTo(other: TimeDuration): boolean {
    return this.milliseconds === other.milliseconds;
  }

  isZero(): boolean {
    return this.milliseconds === 0;
  }

  percentageOf(total: TimeDuration): number {
    if (total.isZero()) return 0;
    return (this.milliseconds / total.milliseconds) * 100;
  }
}