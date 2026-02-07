import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, useWindowDimensions } from "react-native";
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
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

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
      case TimerMode.FOCUS: return "#FF4D4D";
      case TimerMode.SHORT_BREAK: return "#4DFF88";
      case TimerMode.LONG_BREAK: return "#4D88FF";
      default: return "#FFFFFF";
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F0F0F', '#1A1A1A']}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Background Decorative Blobs */}
        <View style={[styles.blob, { top: -100, left: -100, backgroundColor: getModeColor() + '22' }]} />
        <View style={[styles.blob, { bottom: -150, right: -100, backgroundColor: getModeColor() + '11', width: 400, height: 400 }]} />

        <SettingsModal 
          visible={modalVisible} 
          onClose={() => setModalVisible(false)} 
          onSave={updateCustomTime}
          initialMinutes={Math.floor(totalDuration / 60)} 
        />

        <View style={styles.safeArea}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.glassContainer}>
              <Text style={styles.streakText}>🔥 {streak} days</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setModalVisible(true)} 
              style={[styles.settingsButton, styles.glassContainer]}
            >
              <Ionicons name="settings-outline" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.content, isLandscape && styles.contentLandscape]}
          >
            {/* Left/Top Section: Timer */}
            <View style={[styles.timerSection, isLandscape && styles.timerSectionLandscape]}>
              <View style={styles.timerWrapper}>
                <TimerDisplay 
                  timeRemaining={timeRemaining} 
                  totalDuration={totalDuration}
                  onPress={reset} 
                  modeColor={getModeColor()}
                />
              </View>
            </View>

            {/* Right/Bottom Section: Controls and Task */}
            <View style={[styles.controlsSection, isLandscape && styles.controlsSectionLandscape]}>
              {/* Mode Selector */}
              <View style={styles.modeSelectorGlass}>
                {[TimerMode.FOCUS, TimerMode.SHORT_BREAK, TimerMode.LONG_BREAK].map((m) => (
                  <TouchableOpacity 
                    key={m} 
                    onPress={() => switchMode(m)}
                    style={[
                      styles.modeButton, 
                      mode === m && { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: getModeColor() }
                    ]}
                  >
                    <Text style={[
                      styles.modeButtonText, 
                      mode === m && { color: '#FFF', fontWeight: '700' }
                    ]}>
                      {m === TimerMode.FOCUS ? "Focus" : m === TimerMode.SHORT_BREAK ? "Short" : "Long"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Task Input */}
              <View style={styles.taskContainer}>
                {!isRunning && mode === TimerMode.FOCUS ? (
                  <TextInput
                    style={styles.taskInput}
                    placeholder="Enter focus task..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={task}
                    onChangeText={setTask}
                    selectionColor={getModeColor()}
                  />
                ) : (
                  <Text style={styles.activeTaskText}>{task || (mode === TimerMode.FOCUS ? "Ready to focus?" : "Take a breather")}</Text>
                )}
              </View>

              {/* Controls */}
              <TimerControls 
                isRunning={isRunning} 
                onStart={start} 
                onStop={stop} 
                isAlarmActive={isAlarmActive}
                onStopAlarm={stopAlarm}
                modeColor={getModeColor()}
              />
            </View>
            
            {!isLandscape && <View style={{ height: 40 }} />}
          </KeyboardAvoidingView>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.6,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  glassContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  streakText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  settingsButton: {
    padding: 10,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  contentLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  timerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerSectionLandscape: {
    flex: 1,
  },
  controlsSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsSectionLandscape: {
    flex: 1,
    paddingLeft: 20,
  },
  modeSelectorGlass: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 6,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 30,
  },
  modeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeButtonText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
  taskContainer: {
    height: 60,
    justifyContent: 'center',
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  taskInput: {
    color: '#FFF',
    fontSize: 22,
    textAlign: 'center',
    width: '80%',
    paddingBottom: 4,
    fontWeight: '500',
  },
  activeTaskText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  timerWrapper: {
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
});
