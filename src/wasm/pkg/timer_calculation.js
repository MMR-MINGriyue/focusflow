// Mock WASM module for timer calculations
export function get_optimal_update_interval() {
  return 16;
}

export function calculate_progress(total, elapsed) {
  return Math.min(elapsed / total, 1);
}

export function format_time(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculate_time_remaining(total, elapsed) {
  return Math.max(total - elapsed, 0);
}

const timer_calculation = {
  get_optimal_update_interval,
  calculate_progress,
  format_time,
  calculate_time_remaining
};

export default timer_calculation;
