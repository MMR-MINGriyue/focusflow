// WASM模块类型声明
declare module './pkg/timer_calculation' {
  export class TimerCalculation {
    constructor();
    calculate_elapsed_time(start_time: number, end_time: number): number;
    calculate_remaining_time(total_duration: number, elapsed_time: number): number;
    format_time_display(seconds: number): string;
    validate_timer_settings(focus_duration: number, break_duration: number): boolean;
  }
  
  export function init(): Promise<void>;
}