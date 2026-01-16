import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface TimerControlsProps {
    isRunning: boolean;
    onStart: () => void;
    onStop: () => void;
    isAlarmActive: boolean;
    onStopAlarm: () => void;
}

export function TimerControls({ isRunning, onStart, onStop, isAlarmActive, onStopAlarm }: TimerControlsProps) {
    if (isAlarmActive) {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    style={[styles.button, styles.alarmButton]}
                    onPress={onStopAlarm}
                >
                    <Text style={styles.alarmButtonText}>
                        STOP ALARM
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, isRunning ? styles.stopButton : styles.startButton]}
                onPress={isRunning ? onStop : onStart}
            >
                <Text style={styles.buttonText}>
                    {isRunning ? "Stop" : "Start"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: 20,
    },
    button: {
        paddingVertical: 18,
        paddingHorizontal: 64,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startButton: {
        backgroundColor: '#FFF',
    },
    stopButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    alarmButton: {
        backgroundColor: "#FF3B30",
        shadowColor: "#FF3B30",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    buttonText: {
        color: "#000",
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    alarmButtonText: {
        color: "#FFF",
        fontSize: 20,
        fontWeight: "800",
    },
});
