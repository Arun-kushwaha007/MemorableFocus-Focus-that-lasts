import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface TimerControlsProps {
    isRunning: boolean;
    onStart: () => void;
    onStop: () => void;
    isAlarmActive: boolean;
    onStopAlarm: () => void;
    modeColor: string;
}

export function TimerControls({ isRunning, onStart, onStop, isAlarmActive, onStopAlarm, modeColor }: TimerControlsProps) {
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
                style={[
                    styles.button, 
                    isRunning ? styles.stopButton : { backgroundColor: modeColor }
                ]}
                onPress={isRunning ? onStop : onStart}
            >
                <Text style={[styles.buttonText, !isRunning && { color: '#000' }]}>
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
        marginTop: 20,
    },
    button: {
        paddingVertical: 18,
        paddingHorizontal: 80,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    startButton: {
        // Dynamic color now
    },
    stopButton: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    alarmButton: {
        backgroundColor: "#FF3B30",
        shadowColor: "#FF3B30",
        paddingHorizontal: 60,
    },
    buttonText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "800",
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    alarmButtonText: {
        color: "#FFF",
        fontSize: 20,
        fontWeight: "900",
        letterSpacing: 1,
    },
});
