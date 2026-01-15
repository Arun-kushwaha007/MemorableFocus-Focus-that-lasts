import { useState, useEffect } from "react";
import { Text, View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export async function playCompletionSound(): Promise<void> {
  try {
    // Attempt to load custom completion sound
    // Note: Add completion.mp3 to assets/sounds/ for custom sound
    // See assets/sounds/README.md for instructions
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/completion.mp3')
    );
    await sound.playAsync();
    
    // Unload sound after playing to free memory
    await sound.unloadAsync();
  } catch (error) {
    console.error('Error playing completion sound:', error);
    console.error('Make sure completion.mp3 exists in assets/sounds/ directory');
    console.log('Tip: Add a completion.mp3 file to assets/sounds/ - see README.md in that directory');
  }
}

export async function triggerVibration(): Promise<void> {
  try {
    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );
  } catch (error) {
    console.error('Error triggering vibration:', error);
  }
}

export async function enableDND(): Promise<void> {
  try {
    // Note: DND mode cannot be programmatically controlled on mobile platforms
    // This is a platform limitation - DND must be controlled by the user
    // The timer will continue to work normally without DND integration
    console.log('DND mode would be enabled here (platform limitation)');
  } catch (error) {
    console.error('Error enabling DND:', error);
  }
}

export async function disableDND(): Promise<void> {
  try {
    // Note: DND mode cannot be programmatically controlled on mobile platforms
    // This is a platform limitation - DND must be controlled by the user
    // The timer will continue to work normally without DND integration
    console.log('DND mode would be disabled here (platform limitation)');
  } catch (error) {
    console.error('Error disabling DND:', error);
  }
}

export async function loadStreak(): Promise<{ streak: number; lastCompletionDate: string | null }> {
  try {
    const streakValue = await AsyncStorage.getItem('@focus_timer_streak');
    const lastDateValue = await AsyncStorage.getItem('@focus_timer_last_completion');
    
    const streak = streakValue ? parseInt(streakValue, 10) : 0;
    const lastCompletionDate = lastDateValue || null;
    
    // Handle invalid data gracefully
    if (isNaN(streak)) {
      return { streak: 0, lastCompletionDate: null };
    }
    
    return { streak, lastCompletionDate };
  } catch (error) {
    console.error('Error loading streak:', error);
    return { streak: 0, lastCompletionDate: null };
  }
}

export async function saveStreak(newStreak: number, date: string): Promise<void> {
  try {
    await AsyncStorage.setItem('@focus_timer_streak', String(newStreak));
    await AsyncStorage.setItem('@focus_timer_last_completion', date);
  } catch (error) {
    console.error('Error saving streak:', error);
  }
}

export function calculateStreak(currentStreak: number, lastDate: string | null, currentDate: string): number {
  if (!lastDate) {
    return 1;
  }
  
  const last = new Date(lastDate);
  const current = new Date(currentDate);
  
  // Reset time components for date-only comparison
  last.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    // Same day - maintain current streak
    return currentStreak;
  } else if (daysDiff === 1) {
    // Consecutive day - increment streak
    return currentStreak + 1;
  } else {
    // Gap in days - reset streak
    return 1;
  }
}

export default function Index() {
  const [timeRemaining, setTimeRemaining] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastCompletionDate, setLastCompletionDate] = useState<string | null>(null);

  const tick = () => {
    setTimeRemaining((prev) => prev - 1);
  };

  const handleCompletion = async () => {
    // Stop timer automatically when timeRemaining reaches 0
    setIsRunning(false);
    
    // Deactivate keep-awake when timer completes
    deactivateKeepAwake();
    
    // Disable DND when timer completes
    await disableDND();
    
    // Calculate new streak based on current date
    const currentDate = new Date().toISOString();
    const newStreak = calculateStreak(streak, lastCompletionDate, currentDate);
    
    // Update state
    setStreak(newStreak);
    setLastCompletionDate(currentDate);
    
    // Save updated streak to AsyncStorage
    await saveStreak(newStreak, currentDate);
    
    // Trigger sound and vibration
    await Promise.all([
      playCompletionSound(),
      triggerVibration()
    ]);
  };

  const handleStart = async () => {
    if (timeRemaining === 0) {
      // Reset to 1500 and start when timeRemaining is 0
      setTimeRemaining(1500);
    }
    // Set isRunning to true when timer is stopped
    setIsRunning(true);
    
    // Enable DND when timer starts
    await enableDND();
    
    // Activate keep-awake when timer starts
    await activateKeepAwakeAsync();
  };

  const handleStop = async () => {
    // Set isRunning to false
    // Preserve current timeRemaining value
    setIsRunning(false);
    
    // Deactivate keep-awake when timer stops
    deactivateKeepAwake();
    
    // Disable DND when timer stops
    await disableDND();
  };

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      const intervalId = setInterval(tick, 1000);
      return () => clearInterval(intervalId);
    } else if (timeRemaining === 0 && isRunning) {
      handleCompletion();
    }
  }, [isRunning, timeRemaining]);

  useEffect(() => {
    // Load streak on mount
    const initializeStreak = async () => {
      const { streak: loadedStreak, lastCompletionDate: loadedDate } = await loadStreak();
      setStreak(loadedStreak);
      setLastCompletionDate(loadedDate);
    };
    initializeStreak();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 20,
      }}
    >
      {/* Streak counter at top */}
      <View style={{ position: "absolute", top: 60 }}>
        <Text style={{ fontSize: 18, color: "#333333" }}>
          🔥 Streak: {streak} days
        </Text>
      </View>

      {/* Timer display prominently in center */}
      <Text style={{ fontSize: 72, fontWeight: "bold", color: "#000000", marginBottom: 40 }}>
        {formatTime(timeRemaining)}
      </Text>

      {/* Start/Stop button below timer */}
      <View
        style={{
          backgroundColor: "#000000",
          paddingVertical: 16,
          paddingHorizontal: 48,
          borderRadius: 8,
        }}
        onTouchEnd={isRunning ? handleStop : handleStart}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "600" }}>
          {isRunning ? "Stop" : "Start"}
        </Text>
      </View>
    </View>
  );
}
