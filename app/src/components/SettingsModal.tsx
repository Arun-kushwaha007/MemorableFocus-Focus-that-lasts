import React, { useState, useEffect } from 'react';
import { 
    Modal, 
    TouchableWithoutFeedback, 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Keyboard,
    StyleSheet
} from 'react-native';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (minutes: number) => void;
    initialMinutes?: number;
}

export function SettingsModal({ visible, onClose, onSave, initialMinutes = 25 }: SettingsModalProps) {
    const [inputMinutes, setInputMinutes] = useState(String(initialMinutes));

    useEffect(() => {
        if (visible) {
            setInputMinutes(String(initialMinutes));
        }
    }, [visible, initialMinutes]);

    const handleSave = () => {
        const minutes = parseInt(inputMinutes, 10);
        if (isNaN(minutes) || minutes <= 0) {
            alert("Please enter a valid number of minutes."); 
            return;
        }
        onSave(minutes);
        onClose();
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.title}>Set Timer Duration</Text>
                        <Text style={styles.label}>Minutes:</Text>
                        <TextInput 
                            style={styles.input}
                            keyboardType="number-pad"
                            value={inputMinutes}
                            onChangeText={setInputMinutes}
                            maxLength={3}
                            placeholderTextColor="#666"
                        />
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity 
                                onPress={onClose}
                                style={[styles.button, styles.cancelButton]}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={handleSave}
                                style={[styles.button, styles.saveButton]}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.8)",
    },
    modalContent: {
        width: '85%',
        backgroundColor: "#1a1a1a",
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: "#333",
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#FFF",
        marginBottom: 20,
        textAlign: "center",
    },
    label: {
        fontSize: 14,
        color: "#888",
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: "#222",
        borderRadius: 12,
        padding: 16,
        fontSize: 24,
        color: "#FFF",
        marginBottom: 24,
        textAlign: "center",
        borderWidth: 1,
        borderColor: "#444",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    cancelButton: {
        backgroundColor: "#222",
    },
    saveButton: {
        backgroundColor: "#FFF",
    },
    cancelButtonText: {
        color: "#AAA",
        fontWeight: "600",
        fontSize: 16,
    },
    saveButtonText: {
        color: "#000",
        fontWeight: "700",
        fontSize: 16,
    },
});
