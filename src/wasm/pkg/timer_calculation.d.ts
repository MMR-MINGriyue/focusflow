export function get_optimal_update_interval(): number;
export function calculate_progress(total: number, elapsed: number): number;
export function format_time(seconds: number): string;
export function calculate_time_remaining(total: number, elapsed: number): number;

declare const timer_calculation: {
  get_optimal_update_interval: typeof get_optimal_update_interval;
  calculate_progress: typeof calculate_progress;
  format_time: typeof format_time;
  calculate_time_remaining: typeof calculate_time_remaining;
};

export default timer_calculation;
