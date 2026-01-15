import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

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
            <View style={{ flexDirection: "row", gap: 20 }}>
                <TouchableOpacity
                    style={{
                        backgroundColor: "#FF3B30",
                        paddingVertical: 20,
                        paddingHorizontal: 60,
                        borderRadius: 12,
                        shadowColor: "#FF3B30",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 5
                    }}
                    onPress={onStopAlarm}
                >
                    <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "bold" }}>
                        STOP ALARM
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flexDirection: "row", gap: 20 }}>
            <TouchableOpacity
                style={{
                    backgroundColor: isRunning ? "#FF3B30" : "#000000",
                    paddingVertical: 16,
                    paddingHorizontal: 48,
                    borderRadius: 8,
                    opacity: isRunning ? 0.9 : 1
                }}
                onPress={isRunning ? onStop : onStart}
            >
                <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "600" }}>
                    {isRunning ? "Stop" : "Start"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}
