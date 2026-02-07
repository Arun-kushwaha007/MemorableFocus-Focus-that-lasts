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
import { Ionicons } from '@expo/vector-icons';

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
                        <View style={styles.header}>
                          <Text style={styles.title}>Settings</Text>
                          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="rgba(255,255,255,0.5)" />
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>FOCUS DURATION (MINS)</Text>
                        <TextInput 
                            style={styles.input}
                            keyboardType="number-pad"
                            value={inputMinutes}
                            onChangeText={setInputMinutes}
                            maxLength={3}
                            placeholderTextColor="#666"
                            selectionColor="#FF4D4D"
                        />

                        <TouchableOpacity 
                            onPress={handleSave}
                            style={styles.saveButton}
                        >
                            <Text style={styles.saveButtonText}>Apply Changes</Text>
                        </TouchableOpacity>
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
        backgroundColor: "rgba(0,0,0,0.7)",
    },
    modalContent: {
        width: '85%',
        backgroundColor: "rgba(30,30,30,0.95)",
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#FFF",
        letterSpacing: 0.5,
    },
    closeButton: {
        padding: 4,
    },
    label: {
        fontSize: 12,
        color: "rgba(255,255,255,0.5)",
        marginBottom: 12,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    input: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 20,
        padding: 20,
        fontSize: 32,
        color: "#FFF",
        marginBottom: 30,
        textAlign: "center",
        fontWeight: '700',
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    saveButton: {
        backgroundColor: "#FFF",
        padding: 18,
        borderRadius: 20,
        alignItems: "center",
        shadowColor: "#FFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    saveButtonText: {
        color: "#000",
        fontWeight: "800",
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
