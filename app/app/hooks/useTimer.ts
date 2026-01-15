import { useState, useEffect, useRef } from 'react';
import { AppState, Alert } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import { loadStreak, saveStreak, saveCustomTime } from '../utils/storage';
import { calculateStreak } from '../utils/time';

const DEFAULT_TIME = 1500; // 25 minutes

export function useTimer(onComplete: () => void) {
  const [customTime, setCustomTime] = useState(DEFAULT_TIME);
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastCompletionDate, setLastCompletionDate] = useState<string | null>(null);
  
  const endTimeRef = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);

  // Load Streak only on mount.
  // We explicitly DO NOT load custom time to enforce default 25min on reload.
  useEffect(() => {
    const initialize = async () => {
      const { streak: loadedStreak, lastCompletionDate: loadedDate } = await loadStreak();
      setStreak(loadedStreak);
      setLastCompletionDate(loadedDate);
      
      const { status } = await Notifications.requestPermissionsAsync();
    };
    initialize();
  }, []);

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
  }, [isRunning]);

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
  }, [isRunning, timeRemaining]);

  const handleCompletion = async () => {
    setIsRunning(false);
    setTimeRemaining(0);
    endTimeRef.current = null;
    deactivateKeepAwake();
    
    const currentDate = new Date().toISOString();
    const newStreak = calculateStreak(streak, lastCompletionDate, currentDate);
    
    setStreak(newStreak);
    setLastCompletionDate(currentDate);
    await saveStreak(newStreak, currentDate);
    
    onComplete();
  };

  const start = async () => {
    if (timeRemaining === 0) {
        setTimeRemaining(customTime);
    }
    setIsRunning(true);
    await activateKeepAwakeAsync();
    
    const duration = timeRemaining === 0 ? customTime : timeRemaining;
    const now = Date.now();
    const targetTime = now + (duration * 1000);
    endTimeRef.current = targetTime;

    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Focus Session Complete! 🎉",
                body: "Great job! Take a break.",
                sound: true,
            },
            trigger: new Date(targetTime) as any,
        });
    } catch (e) {
        console.error("Notification schedule error:", e);
    }
  };

  const stop = async () => {
    setIsRunning(false);
    endTimeRef.current = null;
    deactivateKeepAwake();
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const reset = () => {
    stop();
    // Requirement: "also reset the time and also keep the defaut time 25 min"
    // Does this mean reset sets it to 25? Or sets it to customTime?
    // "keep the default time 25 min... every time app reloads"
    // I'll assume Reset button goes back to customTime (user set), BUT if we want "default 25", maybe we should reset customTime too?
    // User said "reset the time and also keep the default time 25 min" is ambiguous.
    // I will interpret: Reset -> Go to 25 min (Default).
    setCustomTime(DEFAULT_TIME);
    setTimeRemaining(DEFAULT_TIME);
  };

  const updateCustomTime = async (minutes: number) => {
      const seconds = minutes * 60;
      setCustomTime(seconds);
      setTimeRemaining(seconds);
      setIsRunning(false);
      await saveCustomTime(seconds); // We save it, but we don't load it on mount (per requirement)
  };

  return {
      timeRemaining,
      streak,
      isRunning,
      customTime,
      start,
      stop,
      reset,
      updateCustomTime
  };
}
