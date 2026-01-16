import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Vibration } from 'react-native';

export function useAudio() {
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const playAlarm = async () => {
    try {
      // Prevent multiple overlaps
      await stopAlarm();

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/completion.mp3'),
        { isLooping: true }
      );
      soundRef.current = sound;
      await sound.playAsync();
      setIsAlarmActive(true);

      // Continuous Vibration using standard Vibration API
      // Pattern: wait 0ms, vibrate 1000ms, wait 500ms...
      const VIBRATE_PATTERN = [0, 1000, 500];
      Vibration.vibrate(VIBRATE_PATTERN, true); // true for looping

      // Auto-stop after 40 seconds
      autoStopTimeoutRef.current = setTimeout(() => {
        stopAlarm();
      }, 40000);

    } catch (error) {
      console.error('Error playing alarm:', error);
    }
  };

  const stopAlarm = async () => {
    setIsAlarmActive(false);

    // Stop Sound
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {
          // ignore
      }
      soundRef.current = null;
    }

    // Stop Vibration
    Vibration.cancel();

    // Clear Timeout
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlarm();
    };
  }, []);

  return {
    isAlarmActive,
    playAlarm,
    stopAlarm
  };
}
