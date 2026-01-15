import * as fc from 'fast-check';
import { calculateStreak, loadStreak, saveStreak } from '../index';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage with a simple in-memory implementation
const mockStore: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn((key: string, value: string) => {
      mockStore[key] = value;
      return Promise.resolve();
    }),
    getItem: jest.fn((key: string) => {
      return Promise.resolve(mockStore[key] || null);
    }),
    clear: jest.fn(() => {
      Object.keys(mockStore).forEach(key => delete mockStore[key]);
      return Promise.resolve();
    }),
  },
}));

describe('Streak Calculation Property-Based Tests', () => {
  beforeEach(async () => {
    // Clear AsyncStorage before each test
    await AsyncStorage.clear();
  });
  // Feature: focus-timer, Property 10: Streak calculation for consecutive days
  // Validates: Requirements 6.4
  test('Property 10: Streak increments by 1 for consecutive days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }), // current streak
        fc.integer({ min: 0, max: 3650 }), // days since epoch (to avoid invalid dates)
        (currentStreak, daysSinceEpoch) => {
          // Create valid dates using timestamp
          const baseDate = new Date(2020, 0, 1); // Jan 1, 2020
          const lastDate = new Date(baseDate.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
          
          // Calculate yesterday's date from lastDate
          const yesterday = new Date(lastDate);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayISO = yesterday.toISOString();
          
          // Current date is lastDate (one day after yesterday)
          const currentDateISO = lastDate.toISOString();
          
          // Calculate streak with yesterday as last completion
          const newStreak = calculateStreak(currentStreak, yesterdayISO, currentDateISO);
          
          // Streak should increment by 1
          expect(newStreak).toBe(currentStreak + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: focus-timer, Property 11: Streak calculation for same day
  // Validates: Requirements 6.4
  test('Property 11: Streak remains unchanged for same day completions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // current streak (must be at least 1)
        fc.integer({ min: 0, max: 3650 }), // days since epoch
        (currentStreak, daysSinceEpoch) => {
          // Create valid date using timestamp
          const baseDate = new Date(2020, 0, 1); // Jan 1, 2020
          const completionDate = new Date(baseDate.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
          const dateISO = completionDate.toISOString();
          
          // Calculate streak with same date as last completion and current date
          const newStreak = calculateStreak(currentStreak, dateISO, dateISO);
          
          // Streak should remain unchanged
          expect(newStreak).toBe(currentStreak);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: focus-timer, Property 12: Streak reset after gap
  // Validates: Requirements 6.3
  test('Property 12: Streak resets to 1 after gap > 1 day', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // current streak
        fc.integer({ min: 0, max: 3650 }), // days since epoch for last date
        fc.integer({ min: 2, max: 365 }), // gap in days (at least 2)
        (currentStreak, daysSinceEpoch, gapDays) => {
          // Create valid dates using timestamp
          const baseDate = new Date(2020, 0, 1); // Jan 1, 2020
          const lastDate = new Date(baseDate.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
          const lastDateISO = lastDate.toISOString();
          
          // Calculate current date with gap
          const currentDate = new Date(lastDate);
          currentDate.setDate(currentDate.getDate() + gapDays);
          const currentDateISO = currentDate.toISOString();
          
          // Calculate streak with gap
          const newStreak = calculateStreak(currentStreak, lastDateISO, currentDateISO);
          
          // Streak should reset to 1
          expect(newStreak).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: First completion (no previous date)
  test('Property 12 (edge case): Streak starts at 1 for first completion', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }), // current streak (doesn't matter for first completion)
        fc.integer({ min: 0, max: 3650 }), // days since epoch
        (currentStreak, daysSinceEpoch) => {
          // Create valid date using timestamp
          const baseDate = new Date(2020, 0, 1); // Jan 1, 2020
          const currentDate = new Date(baseDate.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
          const currentDateISO = currentDate.toISOString();
          
          // Calculate streak with no previous completion (null)
          const newStreak = calculateStreak(currentStreak, null, currentDateISO);
          
          // Streak should be 1 (first completion)
          expect(newStreak).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: focus-timer, Property 13: Streak persistence round-trip
  // Validates: Requirements 6.2, 6.6
  test('Property 13: Saving and loading streak returns same values', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1000 }), // streak value
        fc.integer({ min: 0, max: 3650 }), // days since epoch
        async (streakValue, daysSinceEpoch) => {
          // Create valid date using timestamp
          const baseDate = new Date(2020, 0, 1); // Jan 1, 2020
          const completionDate = new Date(baseDate.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
          const dateISO = completionDate.toISOString();
          
          // Clear storage before test
          await AsyncStorage.clear();
          
          // Save streak to AsyncStorage
          await saveStreak(streakValue, dateISO);
          
          // Load streak from AsyncStorage
          const { streak: loadedStreak, lastCompletionDate: loadedDate } = await loadStreak();
          
          // Loaded values should match saved values
          expect(loadedStreak).toBe(streakValue);
          expect(loadedDate).toBe(dateISO);
        }
      ),
      { numRuns: 100 }
    );
  });
});
