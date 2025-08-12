// Timer Calculation WebAssembly Module
// 用于高性能的计时器数学计算

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TimerState {
    Focus = 0,
    Break = 1,
    MicroBreak = 2,
}

#[wasm_bindgen]
pub struct TimerCalculator {
    start_time: u64,
    duration: u32,
    current_time: u32,
    state: TimerState,
}

#[wasm_bindgen]
impl TimerCalculator {
    #[wasm_bindgen(constructor)]
    pub fn new(duration: u32, state: TimerState) -> TimerCalculator {
        let start_time = js_sys::Date::now() as u64;
        TimerCalculator {
            start_time,
            duration,
            current_time: duration,
            state,
        }
    }

    #[wasm_bindgen]
    pub fn update(&mut self) -> TimerCalculation {
        let now = js_sys::Date::now() as u64;
        let elapsed = ((now - self.start_time) / 1000) as u32;
        self.current_time = self.duration.saturating_sub(elapsed);
        
        TimerCalculation {
            time: self.current_time,
            formatted_time: self.format_time(self.current_time),
            progress: self.calculate_progress(elapsed),
            remaining: self.current_time,
            state: self.state,
        }
    }

    #[wasm_bindgen]
    pub fn reset(&mut self, new_duration: u32, new_state: TimerState) {
        self.start_time = js_sys::Date::now() as u64;
        self.duration = new_duration;
        self.current_time = new_duration;
        self.state = new_state;
    }

    #[wasm_bindgen]
    pub fn pause(&mut self) -> u32 {
        self.current_time
    }

    #[wasm_bindgen]
    pub fn resume(&mut self, remaining_time: u32) {
        self.start_time = js_sys::Date::now() as u64;
        self.duration = remaining_time;
        self.current_time = remaining_time;
    }

    #[wasm_bindgen]
    pub fn calculate_formatted_time(&self, seconds: u32) -> String {
        self.format_time(seconds)
    }

    #[wasm_bindgen]
    pub fn calculate_progress_percentage(&self, current: u32, total: u32) -> f64 {
        if total == 0 { return 0.0; }
        (current as f64 / total as f64) * 100.0
    }

    #[wasm_bindgen]
    pub fn batch_calculate_progress(&self, times: Vec<u32>) -> Vec<f64> {
        times.iter()
            .map(|&time| self.calculate_progress_percentage(time, self.duration))
            .collect()
    }

    #[wasm_bindgen]
    pub fn optimize_display_update(&self, last_update: u32) -> bool {
        // 只在时间变化时更新显示，减少不必要的渲染
        let now = js_sys::Date::now() as u64;
        let elapsed = ((now - self.start_time) / 1000) as u32;
        elapsed != last_update
    }

    #[wasm_bindgen]
    pub fn calculate_next_state(&self, completed: bool) -> TimerState {
        match self.state {
            TimerState::Focus if completed => TimerState::Break,
            TimerState::Break if completed => TimerState::Focus,
            TimerState::MicroBreak if completed => TimerState::Focus,
            _ => self.state,
        }
    }

    #[wasm_bindgen]
    pub fn get_optimal_update_interval(&self) -> u32 {
        // 根据剩余时间动态调整更新频率
        match self.current_time {
            0..=60 => 100,      // 最后1秒，100ms更新
            61..=300 => 500,    // 最后5分钟，500ms更新
            301..=1800 => 1000, // 最后30分钟，1秒更新
            _ => 2000,          // 其他情况，2秒更新
        }
    }

    fn format_time(&self, seconds: u32) -> String {
        let mins = seconds / 60;
        let secs = seconds % 60;
        format!("{:02}:{:02}", mins, secs)
    }

    fn calculate_progress(&self, elapsed: u32) -> f64 {
        if self.duration == 0 { return 0.0; }
        (elapsed as f64 / self.duration as f64) * 100.0
    }
}

#[wasm_bindgen]
pub struct TimerCalculation {
    pub time: u32,
    pub formatted_time: String,
    pub progress: f64,
    pub remaining: u32,
    pub state: TimerState,
}

#[wasm_bindgen]
pub fn calculate_multiple_timers(durations: Vec<u32>) -> Vec<TimerCalculation> {
    let now = js_sys::Date::now() as u64;
    durations
        .iter()
        .enumerate()
        .map(|(i, &duration)| {
            let start_time = now - (i as u64 * 1000); // 模拟不同开始时间
            let elapsed = ((now - start_time) / 1000) as u32;
            let current_time = duration.saturating_sub(elapsed);
            
            TimerCalculation {
                time: current_time,
                formatted_time: format!("{:02}:{:02}", current_time / 60, current_time % 60),
                progress: if duration == 0 { 0.0 } else { (elapsed as f64 / duration as f64) * 100.0 },
                remaining: current_time,
                state: TimerState::Focus,
            }
        })
        .collect()
}

#[wasm_bindgen]
pub fn benchmark_calculation(iterations: u32) -> f64 {
    let start = js_sys::Date::now();
    let mut result = 0.0;
    
    for i in 0..iterations {
        result += (i as f64 * 1.1).sqrt();
    }
    
    let end = js_sys::Date::now();
    end - start
}

// 内存优化函数
#[wasm_bindgen]
pub fn optimize_memory_usage(current_memory: u32) -> u32 {
    // 简单的内存优化策略
    match current_memory {
        0..=1000 => current_memory,
        1001..=10000 => current_memory * 8 / 10, // 减少20%
        _ => current_memory * 7 / 10, // 减少30%
    }
}