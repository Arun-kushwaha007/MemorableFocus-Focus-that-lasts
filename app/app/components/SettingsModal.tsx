import React, { useState, useEffect } from 'react';
import { 
    Modal, 
    TouchableWithoutFeedback, 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Keyboard 
} from 'react-native';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (minutes: number) => void;
    // We can accept initial minutes to pre-fill the input, 
    // but the input state is local to the modal while open.
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
            // Determine if we show alert or just ignore. 
            // In a reusable component, alerting might be okay or callback error.
            // For simplicity, we alert here or let parent handle. 
            // I'll alert here as it was in original.
            alert("Please enter a valid number of minutes."); 
            return;
        }
        onSave(minutes);
        onClose();
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <View style={{ width: 300, backgroundColor: "white", borderRadius: 12, padding: 24, paddingBottom: 16 }}>
                        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16, textAlign: "center" }}>Set Timer Duration</Text>
                        <Text style={{ marginBottom: 8, color: "#666" }}>Minutes:</Text>
                        <TextInput 
                            style={{ 
                                borderWidth: 1, 
                                borderColor: "#DDD", 
                                borderRadius: 8, 
                                padding: 12, 
                                fontSize: 18, 
                                marginBottom: 24,
                                textAlign: "center"
                            }}
                            keyboardType="number-pad"
                            value={inputMinutes}
                            onChangeText={setInputMinutes}
                            maxLength={3}
                        />
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <TouchableOpacity 
                                onPress={onClose}
                                style={{ flex: 1, padding: 12, alignItems: "center", marginRight: 8, backgroundColor: "#F0F0F0", borderRadius: 8 }}
                            >
                                <Text style={{ color: "#333", fontWeight: "600" }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={handleSave}
                                style={{ flex: 1, padding: 12, alignItems: "center", marginLeft: 8, backgroundColor: "#000", borderRadius: 8 }}
                            >
                                <Text style={{ color: "white", fontWeight: "600" }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
