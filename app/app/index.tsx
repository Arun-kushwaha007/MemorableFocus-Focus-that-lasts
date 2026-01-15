import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { useTimer } from './hooks/useTimer';
import { useAudio } from './hooks/useAudio';
import { TimerDisplay } from './components/TimerDisplay';
import { TimerControls } from './components/TimerControls';
import { SettingsModal } from './components/SettingsModal';

// Configure notifications to show even when app is foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function Index() {
  const { isAlarmActive, playAlarm, stopAlarm } = useAudio();
  
  // Pass playAlarm as callback for when timer completes
  const { 
      timeRemaining, 
      streak, 
      isRunning, 
      start, 
      stop, 
      reset, 
      updateCustomTime,
      customTime
  } = useTimer(playAlarm);
  
  const [modalVisible, setModalVisible] = useState(false);

  // Ref to track previous alarm state to detect when it stops
  const prevAlarmActive = useRef(isAlarmActive);

  // Reset timer to default 25min when alarm stops (either manually or auto-timeout)
  useEffect(() => {
    if (prevAlarmActive.current && !isAlarmActive) {
        reset();
    }
    prevAlarmActive.current = isAlarmActive;
  }, [isAlarmActive, reset]);

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
      <SettingsModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSave={updateCustomTime}
        initialMinutes={Math.floor(customTime / 60)} 
      />

      {/* Top Bar with Settings Icon */}
      <View style={{ position: "absolute", top: 50, right: 20, zIndex: 10 }}>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={{ padding: 8 }}>
            <Ionicons name="settings-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Streak counter */}
      <View style={{ position: "absolute", top: 60, left: 20 }}>
        <Text style={{ fontSize: 18, color: "#333333" }}>
          🔥 Streak: {streak} days
        </Text>
      </View>

      {/* Timer display */}
      <TimerDisplay 
        timeRemaining={timeRemaining} 
        onPress={reset} 
      />

      {/* Controls */}
      <TimerControls 
        isRunning={isRunning} 
        onStart={start} 
        onStop={stop} 
        isAlarmActive={isAlarmActive}
        onStopAlarm={stopAlarm}
      />
      
      {/* Helper text */}
      {!isRunning && !isAlarmActive && (
          <Text style={{ marginTop: 24, color: "#888", fontSize: 14 }}>
              Tap timer to reset
          </Text>
      )}
    </View>
  );
}
