import { useState, useEffect } from "react";
import { Text, View } from "react-native";

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export default function Index() {
  const [timeRemaining, setTimeRemaining] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);

  const tick = () => {
    setTimeRemaining((prev) => prev - 1);
  };

  const handleStart = () => {
    if (timeRemaining === 0) {
      // Reset to 1500 and start when timeRemaining is 0
      setTimeRemaining(1500);
    }
    // Set isRunning to true when timer is stopped
    setIsRunning(true);
  };

  const handleStop = () => {
    // Set isRunning to false
    // Preserve current timeRemaining value
    setIsRunning(false);
  };

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      const intervalId = setInterval(tick, 1000);
      return () => clearInterval(intervalId);
    }
  }, [isRunning, timeRemaining]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Memorable </Text>
    </View>
  );
}
