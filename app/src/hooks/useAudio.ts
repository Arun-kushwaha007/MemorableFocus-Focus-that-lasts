import { useState, useRef, useEffect, useCallback } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { Vibration } from 'react-native';

// Note: expo-audio requires a static import for assets
const completionSound = require('../../assets/sounds/completion.mp3');

export function useAudio() {
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const autoStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const player = useAudioPlayer(completionSound);

  const stopAlarm = useCallback(async () => {
    setIsAlarmActive(false);

    // Stop Sound
    try {
      player.pause();
      player.seekTo(0);
    } catch {
      // ignore
    }

    // Stop Vibration
    Vibration.cancel();

    // Clear Timeout
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
  }, [player]);

  const playAlarm = async () => {
    try {
      // Prevent multiple overlaps
      await stopAlarm();

      player.loop = true;
      player.play();
      setIsAlarmActive(true);

      // Continuous Vibration
      const VIBRATE_PATTERN = [0, 1000, 500];
      Vibration.vibrate(VIBRATE_PATTERN, true);

      // Auto-stop after 40 seconds
      autoStopTimeoutRef.current = setTimeout(() => {
        stopAlarm();
      }, 40000);

    } catch (error) {
      console.error('Error playing alarm:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlarm();
    };
  }, [stopAlarm]);

  return {
    isAlarmActive,
    playAlarm,
    stopAlarm
  };
}
