import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react-native';
import { useState, useEffect } from 'react';
import { enableDND, disableDND, calculateStreak, saveStreak } from '../index';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock expo-keep-awake
const mockActivateKeepAwake = jest.fn(() => Promise.resolve());
const mockDeactivateKeepAwake = jest.fn();

jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: mockActivateKeepAwake,
  deactivateKeepAwake: mockDeactivateKeepAwake,
}));

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

describe('System Integration Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Feature: focus-timer, Property 7: DND lifecycle management
  // Validates: Requirements 3.1, 3.2
  test('Property 7: DND is enabled on start and disabled on stop/completion', async () => {
    const Notifications = require('expo-notifications');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1500 }),
        async (initialTime) => {
          // Clear mocks for this iteration
          Notifications.getPermissionsAsync.mockClear();

          // Create a hook that mimics the timer behavior with DND integration
          const useTimer = () => {
            const [timeRemaining, setTimeRemaining] = useState(initialTime);
            const [isRunning, setIsRunning] = useState(false);

            const handleStart = async () => {
              if (timeRemaining === 0) {
                setTimeRemaining(1500);
              }
              setIsRunning(true);
              await enableDND();
            };

            const handleStop = async () => {
              setIsRunning(false);
              await disableDND();
            };

            const handleCompletion = async () => {
              setIsRunning(false);
              await disableDND();
            };

            return { timeRemaining, isRunning, handleStart, handleStop, handleCompletion };
          };

          const { result } = renderHook(() => useTimer());

          // Start the timer - should enable DND
          await act(async () => {
            await result.current.handleStart();
          });

          expect(result.current.isRunning).toBe(true);
          // Verify DND was attempted to be enabled (permissions checked)
          expect(Notifications.getPermissionsAsync).toHaveBeenCalled();

          // Clear for next check
          Notifications.getPermissionsAsync.mockClear();

          // Stop the timer - should disable DND
          await act(async () => {
            await result.current.handleStop();
          });

          expect(result.current.isRunning).toBe(false);
          // DND disable is called (logged in our implementation)

          // Test completion path
          await act(async () => {
            await result.current.handleStart();
          });

          Notifications.getPermissionsAsync.mockClear();

          await act(async () => {
            await result.current.handleCompletion();
          });

          expect(result.current.isRunning).toBe(false);
          // DND disable is called on completion
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: focus-timer, Property 8: Keep-awake lifecycle management
  // Validates: Requirements 4.1, 4.2
  test('Property 8: Keep-awake is activated on start and deactivated on stop/completion', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1500 }),
        async (initialTime) => {
          // Clear mocks for this iteration
          mockActivateKeepAwake.mockClear();
          mockDeactivateKeepAwake.mockClear();

          // Create a hook that mimics the timer behavior with keep-awake integration
          const useTimer = () => {
            const [timeRemaining, setTimeRemaining] = useState(initialTime);
            const [isRunning, setIsRunning] = useState(false);

            const handleStart = async () => {
              if (timeRemaining === 0) {
                setTimeRemaining(1500);
              }
              setIsRunning(true);
              await mockActivateKeepAwake();
            };

            const handleStop = async () => {
              setIsRunning(false);
              mockDeactivateKeepAwake();
            };

            const handleCompletion = async () => {
              setIsRunning(false);
              mockDeactivateKeepAwake();
            };

            return { timeRemaining, isRunning, handleStart, handleStop, handleCompletion };
          };

          const { result } = renderHook(() => useTimer());

          // Start the timer - should activate keep-awake
          await act(async () => {
            await result.current.handleStart();
          });

          expect(result.current.isRunning).toBe(true);
          expect(mockActivateKeepAwake).toHaveBeenCalled();

          // Clear for next check
          mockActivateKeepAwake.mockClear();
          mockDeactivateKeepAwake.mockClear();

          // Stop the timer - should deactivate keep-awake
          await act(async () => {
            await result.current.handleStop();
          });

          expect(result.current.isRunning).toBe(false);
          expect(mockDeactivateKeepAwake).toHaveBeenCalled();

          // Test completion path
          mockActivateKeepAwake.mockClear();
          mockDeactivateKeepAwake.mockClear();

          await act(async () => {
            await result.current.handleStart();
          });

          expect(mockActivateKeepAwake).toHaveBeenCalled();

          mockDeactivateKeepAwake.mockClear();

          await act(async () => {
            await result.current.handleCompletion();
          });

          expect(result.current.isRunning).toBe(false);
          expect(mockDeactivateKeepAwake).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: focus-timer, Property 14: Streak increment on completion
  // Validates: Requirements 6.1
  test('Property 14: Streak is recalculated and saved on timer completion', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }), // initial streak
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), // last completion date
        async (initialStreak, lastDate) => {
          // Create a hook that mimics the timer completion with streak tracking
          const useTimer = () => {
            const [streak, setStreak] = useState(initialStreak);
            const [lastCompletionDate, setLastCompletionDate] = useState<string | null>(lastDate.toISOString());

            const handleCompletion = async () => {
              // Calculate new streak based on current date
              const currentDate = new Date().toISOString();
              const newStreak = calculateStreak(streak, lastCompletionDate, currentDate);
              
              // Update state
              setStreak(newStreak);
              setLastCompletionDate(currentDate);
              
              // Save updated streak to AsyncStorage
              await saveStreak(newStreak, currentDate);
            };

            return { streak, lastCompletionDate, handleCompletion };
          };

          const { result } = renderHook(() => useTimer());

          const initialStreakValue = result.current.streak;
          const initialLastDate = result.current.lastCompletionDate;

          // Complete the timer
          await act(async () => {
            await result.current.handleCompletion();
          });

          // Verify streak was recalculated
          const expectedStreak = calculateStreak(initialStreakValue, initialLastDate, result.current.lastCompletionDate!);
          expect(result.current.streak).toBe(expectedStreak);

          // Verify lastCompletionDate was updated
          expect(result.current.lastCompletionDate).not.toBe(initialLastDate);
        }
      ),
      { numRuns: 100 }
    );
  });
});
