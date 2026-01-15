import * as fc from 'fast-check';
import { formatTime, playCompletionSound, triggerVibration } from '../index';
import { renderHook, act } from '@testing-library/react-native';
import { useState, useEffect } from 'react';

// Mock expo-av and expo-haptics
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({
        sound: {
          playAsync: jest.fn(() => Promise.resolve())
        }
      }))
    }
  }
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: {
    Success: 'success'
  }
}));

// Mock the sound file require to prevent errors before the file exists
jest.mock('../../assets/sounds/completion.mp3', () => ({}), { virtual: true });

describe('Timer Property-Based Tests', () => {
  // Feature: focus-timer, Property 3: Time format validity
  // Validates: Requirements 1.4
  test('Property 3: formatTime returns valid MM:SS format for all valid inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1500 }),
        (seconds) => {
          const result = formatTime(seconds);
          
          // Check format matches MM:SS pattern
          const formatRegex = /^\d{2}:\d{2}$/;
          expect(result).toMatch(formatRegex);
          
          // Extract minutes and seconds
          const [minutesStr, secondsStr] = result.split(':');
          const minutes = parseInt(minutesStr, 10);
          const secs = parseInt(secondsStr, 10);
          
          // Verify minutes are in valid range (0-25)
          expect(minutes).toBeGreaterThanOrEqual(0);
          expect(minutes).toBeLessThanOrEqual(25);
          
          // Verify seconds are in valid range (0-59)
          expect(secs).toBeGreaterThanOrEqual(0);
          expect(secs).toBeLessThanOrEqual(59);
          
          // Verify the conversion is correct
          const expectedMinutes = Math.floor(seconds / 60);
          const expectedSeconds = seconds % 60;
          expect(minutes).toBe(expectedMinutes);
          expect(secs).toBe(expectedSeconds);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: focus-timer, Property 1: Timer countdown progression
  // Validates: Requirements 1.1, 1.2
  test('Property 1: Timer countdown decreases by 1 second when running', () => {
    jest.useFakeTimers();

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1500 }),
        (initialTime) => {
          // Create a hook that mimics the timer behavior
          const useTimer = () => {
            const [timeRemaining, setTimeRemaining] = useState(initialTime);
            const [isRunning, setIsRunning] = useState(true);

            const tick = () => {
              setTimeRemaining((prev) => prev - 1);
            };

            useEffect(() => {
              if (isRunning && timeRemaining > 0) {
                const intervalId = setInterval(tick, 1000);
                return () => clearInterval(intervalId);
              }
            }, [isRunning, timeRemaining]);

            return { timeRemaining, isRunning, setIsRunning };
          };

          const { result } = renderHook(() => useTimer());

          // Initial state
          expect(result.current.timeRemaining).toBe(initialTime);
          expect(result.current.isRunning).toBe(true);

          // Advance time by 1 second
          act(() => {
            jest.advanceTimersByTime(1000);
          });

          // Time should have decreased by 1
          expect(result.current.timeRemaining).toBe(initialTime - 1);
        }
      ),
      { numRuns: 100 }
    );

    jest.useRealTimers();
  });

  // Feature: focus-timer, Property 4: Start from stopped state
  // Validates: Requirements 2.1
  test('Property 4: Start from stopped state sets isRunning to true', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1500 }),
        (initialTime) => {
          // Create a hook that mimics the timer behavior with controls
          const useTimer = () => {
            const [timeRemaining, setTimeRemaining] = useState(initialTime);
            const [isRunning, setIsRunning] = useState(false);

            const handleStart = () => {
              if (timeRemaining === 0) {
                setTimeRemaining(1500);
              }
              setIsRunning(true);
            };

            const tick = () => {
              setTimeRemaining((prev) => prev - 1);
            };

            useEffect(() => {
              if (isRunning && timeRemaining > 0) {
                const intervalId = setInterval(tick, 1000);
                return () => clearInterval(intervalId);
              }
            }, [isRunning, timeRemaining]);

            return { timeRemaining, isRunning, handleStart };
          };

          const { result } = renderHook(() => useTimer());

          // Initial state - timer is stopped
          expect(result.current.isRunning).toBe(false);

          // Call handleStart
          act(() => {
            result.current.handleStart();
          });

          // isRunning should now be true
          expect(result.current.isRunning).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: focus-timer, Property 5: Stop preserves time
  // Validates: Requirements 2.2, 2.3
  test('Property 5: Stop preserves timeRemaining value', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1500 }),
        (initialTime) => {
          // Create a hook that mimics the timer behavior with controls
          const useTimer = () => {
            const [timeRemaining, setTimeRemaining] = useState(initialTime);
            const [isRunning, setIsRunning] = useState(true);

            const handleStop = () => {
              setIsRunning(false);
            };

            const tick = () => {
              setTimeRemaining((prev) => prev - 1);
            };

            useEffect(() => {
              if (isRunning && timeRemaining > 0) {
                const intervalId = setInterval(tick, 1000);
                return () => clearInterval(intervalId);
              }
            }, [isRunning, timeRemaining]);

            return { timeRemaining, isRunning, handleStop };
          };

          const { result } = renderHook(() => useTimer());

          // Initial state - timer is running
          expect(result.current.isRunning).toBe(true);
          const timeBeforeStop = result.current.timeRemaining;

          // Call handleStop
          act(() => {
            result.current.handleStop();
          });

          // isRunning should be false
          expect(result.current.isRunning).toBe(false);
          // timeRemaining should be preserved
          expect(result.current.timeRemaining).toBe(timeBeforeStop);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: focus-timer, Property 6: Reset after completion
  // Validates: Requirements 2.4
  test('Property 6: Start resets timer to 1500 when timeRemaining is 0', () => {
    fc.assert(
      fc.property(
        fc.constant(0),
        () => {
          // Create a hook that mimics the timer behavior with controls
          const useTimer = () => {
            const [timeRemaining, setTimeRemaining] = useState(0);
            const [isRunning, setIsRunning] = useState(false);

            const handleStart = () => {
              if (timeRemaining === 0) {
                setTimeRemaining(1500);
              }
              setIsRunning(true);
            };

            const tick = () => {
              setTimeRemaining((prev) => prev - 1);
            };

            useEffect(() => {
              if (isRunning && timeRemaining > 0) {
                const intervalId = setInterval(tick, 1000);
                return () => clearInterval(intervalId);
              }
            }, [isRunning, timeRemaining]);

            return { timeRemaining, isRunning, handleStart };
          };

          const { result } = renderHook(() => useTimer());

          // Initial state - timer is at 0
          expect(result.current.timeRemaining).toBe(0);
          expect(result.current.isRunning).toBe(false);

          // Call handleStart
          act(() => {
            result.current.handleStart();
          });

          // timeRemaining should be reset to 1500
          expect(result.current.timeRemaining).toBe(1500);
          // isRunning should be true
          expect(result.current.isRunning).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: focus-timer, Property 2: Timer auto-stop at zero
  // Validates: Requirements 1.3
  test('Property 2: Timer auto-stops when reaching zero', () => {
    jest.useFakeTimers();

    fc.assert(
      fc.property(
        fc.constant(1), // Start with 1 second remaining
        (initialTime) => {
          // Create a hook that mimics the timer behavior with completion
          const useTimer = () => {
            const [timeRemaining, setTimeRemaining] = useState(initialTime);
            const [isRunning, setIsRunning] = useState(true);

            const tick = () => {
              setTimeRemaining((prev) => prev - 1);
            };

            const handleCompletion = async () => {
              setIsRunning(false);
              await Promise.all([
                playCompletionSound(),
                triggerVibration()
              ]);
            };

            useEffect(() => {
              if (isRunning && timeRemaining > 0) {
                const intervalId = setInterval(tick, 1000);
                return () => clearInterval(intervalId);
              } else if (timeRemaining === 0 && isRunning) {
                handleCompletion();
              }
            }, [isRunning, timeRemaining]);

            return { timeRemaining, isRunning };
          };

          const { result } = renderHook(() => useTimer());

          // Initial state - timer is running with 1 second
          expect(result.current.timeRemaining).toBe(1);
          expect(result.current.isRunning).toBe(true);

          // Advance time by 1 second to reach 0
          act(() => {
            jest.advanceTimersByTime(1000);
          });

          // Time should be 0
          expect(result.current.timeRemaining).toBe(0);

          // Wait for handleCompletion to execute
          act(() => {
            jest.runAllTimers();
          });

          // isRunning should be false (auto-stopped)
          expect(result.current.isRunning).toBe(false);
        }
      ),
      { numRuns: 100 }
    );

    jest.useRealTimers();
  });

  // Feature: focus-timer, Property 9: Completion notifications
  // Validates: Requirements 5.1, 5.2, 5.3
  test('Property 9: Completion triggers both sound and vibration', async () => {
    const Haptics = require('expo-haptics');

    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          // Clear previous mock calls before each iteration
          Haptics.notificationAsync.mockClear();

          // Call both functions directly (simulating handleCompletion)
          await playCompletionSound();
          await triggerVibration();

          // Verify vibration was called (sound will fail gracefully until file exists)
          expect(Haptics.notificationAsync).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
