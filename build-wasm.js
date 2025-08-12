// Mock WASM build script for compatibility
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 创建WASM模块的mock文件
const wasmDir = path.join(__dirname, 'src', 'wasm', 'pkg');
if (!fs.existsSync(wasmDir)) {
  fs.mkdirSync(wasmDir, { recursive: true });
}

// 创建timer_calculation.js
const timerCalculationJs = `// Mock WASM module for timer calculations
export function get_optimal_update_interval() {
  return 16;
}

export function calculate_progress(total, elapsed) {
  return Math.min(elapsed / total, 1);
}

export function format_time(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return \`\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
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
`;

// 创建timer_calculation.d.ts
const timerCalculationDts = `export function get_optimal_update_interval(): number;
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
`;

fs.writeFileSync(path.join(wasmDir, 'timer_calculation.js'), timerCalculationJs);
fs.writeFileSync(path.join(wasmDir, 'timer_calculation.d.ts'), timerCalculationDts);

console.log('Mock WASM module created successfully');