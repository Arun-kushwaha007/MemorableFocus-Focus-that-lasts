import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { loadStreak, saveStreak, saveCustomTime } from '../utils/storage';
import { calculateStreak } from '../utils/time';

export enum TimerMode {
  FOCUS = 'FOCUS',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK',
}

const DEFAULT_TIMES = {
  [TimerMode.FOCUS]: 1500, // 25 minutes
  [TimerMode.SHORT_BREAK]: 300, // 5 minutes
  [TimerMode.LONG_BREAK]: 900, // 15 minutes
};

export function useTimer(onComplete: () => void) {
  const [mode, setMode] = useState<TimerMode>(TimerMode.FOCUS);
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_TIMES[TimerMode.FOCUS]);
  const [isRunning, setIsRunning] = useState(false);
  const [streak, setStreak] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [lastCompletionDate, setLastCompletionDate] = useState<string | null>(null);
  const [customTimes, setCustomTimes] = useState(DEFAULT_TIMES);
  
  const endTimeRef = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);

  // Load Streak on mount
  useEffect(() => {
    const initialize = async () => {
      const { streak: loadedStreak, lastCompletionDate: loadedDate } = await loadStreak();
      setStreak(loadedStreak);
      setLastCompletionDate(loadedDate);
      await Notifications.requestPermissionsAsync();
    };
    initialize();
  }, []);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeRemaining(customTimes[newMode]);
    setIsRunning(false);
    endTimeRef.current = null;
  }, [customTimes]);

  const handleCompletion = useCallback(async () => {
    setIsRunning(false);
    setTimeRemaining(0);
    endTimeRef.current = null;
    deactivateKeepAwake();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Update streak if it was a FOCUS session
    if (mode === TimerMode.FOCUS) {
      const currentDate = new Date().toISOString();
      const newStreak = calculateStreak(streak, lastCompletionDate, currentDate);
      setStreak(newStreak);
      setLastCompletionDate(currentDate);
      await saveStreak(newStreak, currentDate);
      setSessionCount(prev => prev + 1);
    }

    onComplete();
    
    // Auto-transition logic
    setTimeout(() => {
        if (mode === TimerMode.FOCUS) {
            if ((sessionCount + 1) % 4 === 0) {
                switchMode(TimerMode.LONG_BREAK);
            } else {
                switchMode(TimerMode.SHORT_BREAK);
            }
        } else {
            switchMode(TimerMode.FOCUS);
        }
    }, 1000);
  }, [mode, streak, lastCompletionDate, sessionCount, onComplete, switchMode]);

  // AppState handling
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (isRunning && endTimeRef.current) {
          const now = Date.now();
          const diff = Math.ceil((endTimeRef.current - now) / 1000);
          if (diff <= 0) {
            handleCompletion();
          } else {
            setTimeRemaining(diff);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isRunning, handleCompletion]);

  // Timer Tick
  useEffect(() => {
    let intervalId: any;
    
    if (isRunning && timeRemaining > 0) {
      intervalId = setInterval(() => {
        if (endTimeRef.current) {
          const now = Date.now();
          const diff = Math.ceil((endTimeRef.current - now) / 1000);
          if (diff <= 0) {
            handleCompletion();
          } else {
            setTimeRemaining(diff);
          }
        } else {
           setTimeRemaining((prev) => prev - 1);
        }
      }, 1000);
    } else if (timeRemaining <= 0 && isRunning) {
      handleCompletion();
    }

    return () => clearInterval(intervalId);
  }, [isRunning, timeRemaining, handleCompletion]);

  const start = async () => {
    setIsRunning(true);
    await activateKeepAwakeAsync();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const now = Date.now();
    const targetTime = now + (timeRemaining * 1000);
    endTimeRef.current = targetTime;

    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.scheduleNotificationAsync({
            content: {
                title: mode === TimerMode.FOCUS ? "Focus Session Complete! 🎉" : "Break Over! ☕",
                body: mode === TimerMode.FOCUS ? "Great job! Take a break." : "Ready to focus again?",
                sound: true,
            },
            trigger: {
                type: 'timeInterval', // Explicitly stating type if requested by error
                seconds: Math.max(1, Math.floor((targetTime - Date.now()) / 1000)),
            } as any,
        });
    } catch (e) {
        console.error("Notification schedule error:", e);
    }
  };

  const stop = async () => {
    setIsRunning(false);
    endTimeRef.current = null;
    deactivateKeepAwake();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const reset = () => {
    stop();
    setTimeRemaining(customTimes[mode]);
  };

  const updateCustomTime = async (minutes: number) => {
      const seconds = minutes * 60;
      const newCustomTimes = { ...customTimes, [mode]: seconds };
      setCustomTimes(newCustomTimes);
      setTimeRemaining(seconds);
      setIsRunning(false);
      await saveCustomTime(seconds); 
  };

  return {
      timeRemaining,
      streak,
      isRunning,
      mode,
      sessionCount,
      totalDuration: customTimes[mode],
      start,
      stop,
      reset,
      switchMode,
      updateCustomTime
  };
}

