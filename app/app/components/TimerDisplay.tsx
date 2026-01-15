import React from 'react';
import { Text, TouchableWithoutFeedback } from 'react-native';
import { formatTime } from '../utils/time';

interface TimerDisplayProps {
    timeRemaining: number;
    onPress: () => void;
}

export function TimerDisplay({ timeRemaining, onPress }: TimerDisplayProps) {
    return (
        <TouchableWithoutFeedback onPress={onPress}>
            <Text style={{ fontSize: 72, fontWeight: "bold", color: "#000000", marginBottom: 40 }}>
                {formatTime(timeRemaining)}
            </Text>
        </TouchableWithoutFeedback>
    );
}
