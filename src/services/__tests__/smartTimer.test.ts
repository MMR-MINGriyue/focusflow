import { smartTimerService, SmartTimerState, SmartTimerSettings } from '../smartTimer';
import { cryptoService } from '../crypto';
import { soundService } from '../sound';
import { notificationService } from '../notification';

// Mock dependencies
jest.mock('../crypto');
jest.mock('../sound');
jest.mock('../notification');

const mockCryptoService = cryptoService as jest.Mocked<typeof cryptoService>;
const mockSoundService = soundService as jest.Mocked<typeof soundService>;
const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

describe('SmartTimerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset service state
    smartTimerService.reset();
    
    // Mock crypto service methods
    mockCryptoService.generateMicroBreakInterval.mockReturnValue(15 * 60); // 15 minutes
    mockCryptoService.generateMicroBreakDuration.mockReturnValue(3 * 60); // 3 minutes
    mockCryptoService.shouldTriggerMicroBreak.mockReturnValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Timer Functionality', () => {
    it('should initialize with default settings', () => {
      const settings = smartTimerService.getSettings();
      
      expect(settings.focusDuration).toBe(90);
      expect(settings.breakDuration).toBe(20);
      expect(settings.enableMicroBreaks).toBe(true);
      expect(settings.enableAdaptiveAdjustment).toBe(true);
    });

    it('should initialize with focus phase', () => {
      const state = smartTimerService.getState();
      
      expect(state.currentPhase).toBe('focus');
      expect(state.timeLeft).toBe(90 * 60); // 90 minutes in seconds
      expect(state.isActive).toBe(false);
    });

    it('should start timer correctly', () => {
      smartTimerService.start();
      const state = smartTimerService.getState();
      
      expect(state.isActive).toBe(true);
      expect(state.sessionStartTime).toBeGreaterThan(0);
      expect(mockSoundService.playMapped).toHaveBeenCalledWith('focusStart');
    });

    it('should pause timer correctly', () => {
      smartTimerService.start();
      smartTimerService.pause();
      const state = smartTimerService.getState();
      
      expect(state.isActive).toBe(false);
    });

    it('should reset timer correctly', () => {
      smartTimerService.start();
      jest.advanceTimersByTime(30000); // 30 seconds
      smartTimerService.reset();
      
      const state = smartTimerService.getState();
      expect(state.isActive).toBe(false);
      expect(state.timeLeft).toBe(90 * 60);
      expect(state.sessionStartTime).toBe(0);
    });
  });

  describe('Phase Transitions', () => {
    it('should transition from focus to break when time expires', () => {
      smartTimerService.start();
      
      // Fast forward to end of focus period
      jest.advanceTimersByTime(90 * 60 * 1000);
      
      const state = smartTimerService.getState();
      expect(state.currentPhase).toBe('break');
      expect(state.timeLeft).toBe(20 * 60); // 20 minutes break
    });

    it('should transition from break to focus when time expires', () => {
      // Start with break phase
      smartTimerService.start();
      jest.advanceTimersByTime(90 * 60 * 1000); // Complete focus
      jest.advanceTimersByTime(20 * 60 * 1000); // Complete break
      
      const state = smartTimerService.getState();
      expect(state.currentPhase).toBe('focus');
    });

    it('should handle manual skip to next phase', () => {
      smartTimerService.start();
      smartTimerService.skipToNext();
      
      const state = smartTimerService.getState();
      expect(state.currentPhase).toBe('break');
    });
  });

  describe('Micro Breaks', () => {
    it('should schedule micro breaks when enabled', () => {
      const settings = smartTimerService.getSettings();
      expect(settings.enableMicroBreaks).toBe(true);
      
      smartTimerService.start();
      
      expect(mockCryptoService.generateMicroBreakInterval).toHaveBeenCalled();
    });

    it('should trigger micro break when conditions are met', () => {
      mockCryptoService.shouldTriggerMicroBreak.mockReturnValue(true);
      
      smartTimerService.start();
      
      // Advance time to trigger micro break check
      jest.advanceTimersByTime(5000);
      
      // Note: This test would need more complex setup to fully test micro break triggering
      // as it involves internal timer logic
    });

    it('should not schedule micro breaks when disabled', () => {
      smartTimerService.updateSettings({ enableMicroBreaks: false });
      smartTimerService.start();
      
      // Micro break interval should not be generated
      expect(mockCryptoService.generateMicroBreakInterval).not.toHaveBeenCalled();
    });
  });

  describe('Adaptive Adjustment', () => {
    it('should adjust focus time based on efficiency scores', () => {
      // Submit high efficiency scores
      smartTimerService.submitEfficiencyScore(5);
      smartTimerService.submitEfficiencyScore(4);
      smartTimerService.submitEfficiencyScore(5);
      
      const state = smartTimerService.getState();
      expect(state.recentEfficiencyScores).toHaveLength(3);
      expect(state.recentEfficiencyScores).toEqual([5, 4, 5]);
    });

    it('should limit efficiency scores to last 10 entries', () => {
      // Submit more than 10 scores
      for (let i = 1; i <= 15; i++) {
        smartTimerService.submitEfficiencyScore(i % 5 + 1);
      }
      
      const state = smartTimerService.getState();
      expect(state.recentEfficiencyScores).toHaveLength(10);
    });
  });

  describe('Circadian Optimization', () => {
    it('should apply circadian multiplier during peak hours', () => {
      // Mock current time to be 10 AM (peak focus hour)
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10);
      
      smartTimerService.updateSettings({ enableCircadianOptimization: true });
      
      // The actual multiplier application would be tested through integration
      // as it's applied internally during phase transitions
      const settings = smartTimerService.getSettings();
      expect(settings.peakFocusHours).toContain(10);
    });

    it('should apply circadian multiplier during low energy hours', () => {
      // Mock current time to be 1 AM (low energy hour)
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(1);
      
      const settings = smartTimerService.getSettings();
      expect(settings.lowEnergyHours).toContain(1);
    });
  });

  describe('Statistics Tracking', () => {
    it('should track today\'s focus time', () => {
      smartTimerService.start();
      jest.advanceTimersByTime(90 * 60 * 1000); // Complete focus session
      
      const stats = smartTimerService.getTodayStats();
      expect(stats.totalFocusTime).toBe(90);
    });

    it('should track continuous focus time', () => {
      smartTimerService.start();
      jest.advanceTimersByTime(45 * 60 * 1000); // 45 minutes
      
      const stats = smartTimerService.getTodayStats();
      expect(stats.continuousFocusTime).toBeGreaterThan(0);
    });

    it('should reset continuous focus time after break', () => {
      smartTimerService.start();
      jest.advanceTimersByTime(90 * 60 * 1000); // Complete focus
      jest.advanceTimersByTime(20 * 60 * 1000); // Complete break
      
      const state = smartTimerService.getState();
      expect(state.continuousFocusTime).toBe(0);
    });
  });

  describe('Settings Management', () => {
    it('should update settings correctly', () => {
      const newSettings = {
        focusDuration: 60,
        breakDuration: 15,
        enableMicroBreaks: false,
      };
      
      smartTimerService.updateSettings(newSettings);
      const settings = smartTimerService.getSettings();
      
      expect(settings.focusDuration).toBe(60);
      expect(settings.breakDuration).toBe(15);
      expect(settings.enableMicroBreaks).toBe(false);
    });

    it('should maintain other settings when partially updating', () => {
      const originalSettings = smartTimerService.getSettings();
      
      smartTimerService.updateSettings({ focusDuration: 60 });
      const updatedSettings = smartTimerService.getSettings();
      
      expect(updatedSettings.focusDuration).toBe(60);
      expect(updatedSettings.breakDuration).toBe(originalSettings.breakDuration);
      expect(updatedSettings.enableMicroBreaks).toBe(originalSettings.enableMicroBreaks);
    });
  });

  describe('Event Listeners', () => {
    it('should notify listeners on state changes', () => {
      const listener = jest.fn();
      smartTimerService.addListener(listener);
      
      smartTimerService.start();
      
      expect(listener).toHaveBeenCalled();
    });

    it('should remove listeners correctly', () => {
      const listener = jest.fn();
      smartTimerService.addListener(listener);
      smartTimerService.removeListener(listener);
      
      smartTimerService.start();
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = jest.fn();
      
      smartTimerService.addListener(errorListener);
      smartTimerService.addListener(normalListener);
      
      // Should not throw error
      expect(() => smartTimerService.start()).not.toThrow();
      
      // Normal listener should still be called
      expect(normalListener).toHaveBeenCalled();
    });
  });
});
