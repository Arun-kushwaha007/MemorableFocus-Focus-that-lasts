import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';

import { useTimer, TimerMode } from '../src/hooks/useTimer';
import { useAudio } from '../src/hooks/useAudio';
import { TimerDisplay } from '../src/components/TimerDisplay';
import { TimerControls } from '../src/components/TimerControls';
import { SettingsModal } from '../src/components/SettingsModal';

// Configure notifications
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
  const [task, setTask] = useState("");
  
  const { 
      timeRemaining, 
      streak, 
      isRunning, 
      mode,
      totalDuration,
      start, 
      stop, 
      reset, 
      switchMode,
      updateCustomTime
  } = useTimer(playAlarm);
  
  const [modalVisible, setModalVisible] = useState(false);
  const prevAlarmActive = useRef(isAlarmActive);

  useEffect(() => {
    if (prevAlarmActive.current && !isAlarmActive) {
        reset();
    }
    prevAlarmActive.current = isAlarmActive;
  }, [isAlarmActive, reset]);

  const getModeColor = () => {
    switch (mode) {
      case TimerMode.FOCUS: return "#FF4B4B";
      case TimerMode.SHORT_BREAK: return "#4BFF4B";
      case TimerMode.LONG_BREAK: return "#4B4BFF";
      default: return "#000000";
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a1a', '#000000']}
          style={StyleSheet.absoluteFill}
        />

        <SettingsModal 
          visible={modalVisible} 
          onClose={() => setModalVisible(false)} 
          onSave={updateCustomTime}
          initialMinutes={Math.floor(totalDuration / 60)} 
        />

        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.streakContainer}>
            <Text style={styles.streakText}>🔥 {streak} days</Text>
          </View>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            {[TimerMode.FOCUS, TimerMode.SHORT_BREAK, TimerMode.LONG_BREAK].map((m) => (
              <TouchableOpacity 
                key={m} 
                onPress={() => switchMode(m)}
                style={[
                  styles.modeButton, 
                  mode === m && { backgroundColor: getModeColor() + '33', borderColor: getModeColor() }
                ]}
              >
                <Text style={[
                  styles.modeButtonText, 
                  mode === m && { color: getModeColor() }
                ]}>
                  {m === TimerMode.FOCUS ? "Focus" : m === TimerMode.SHORT_BREAK ? "Short" : "Long"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Task Input */}
          {!isRunning && mode === TimerMode.FOCUS && (
            <TextInput
              style={styles.taskInput}
              placeholder="What are you focusing on?"
              placeholderTextColor="#666"
              value={task}
              onChangeText={setTask}
            />
          )}
          {isRunning && task && (
            <Text style={styles.activeTaskText}>{task}</Text>
          )}

          {/* Timer display */}
          <TimerDisplay 
            timeRemaining={timeRemaining} 
            totalDuration={totalDuration}
            onPress={reset} 
            modeColor={getModeColor()}
          />

          {/* Controls */}
          <TimerControls 
            isRunning={isRunning} 
            onStart={start} 
            onStop={stop} 
            isAlarmActive={isAlarmActive}
            onStopAlarm={stopAlarm}
          />
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  streakContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  streakText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  modeButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  taskInput: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    width: '80%',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 8,
  },
  activeTaskText: {
    color: '#AAA',
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 30,
  },
});
