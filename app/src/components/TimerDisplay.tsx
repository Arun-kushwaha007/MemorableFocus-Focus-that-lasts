import React from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { formatTime } from '../utils/time';
import { CircularProgress } from './CircularProgress';

interface TimerDisplayProps {
    timeRemaining: number;
    totalDuration: number;
    onPress: () => void;
    modeColor: string;
}

export function TimerDisplay({ timeRemaining, totalDuration, onPress, modeColor }: TimerDisplayProps) {
    const progress = timeRemaining / totalDuration;

    return (
        <TouchableWithoutFeedback onPress={onPress}>
            <View style={styles.container}>
                <CircularProgress 
                    progress={progress} 
                    size={280} 
                    strokeWidth={12} 
                    color={modeColor} 
                />
                <View style={styles.textContainer}>
                    <Text style={[styles.timerText, { color: modeColor }]}>
                        {formatTime(timeRemaining)}
                    </Text>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    textContainer: {
        position: 'absolute',
    },
    timerText: {
        fontSize: 64,
        fontWeight: "700",
        fontFamily: 'System', // Placeholder for premium font
    }
});
