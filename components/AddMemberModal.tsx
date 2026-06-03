import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

interface AddMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, icon: string, themeColor: string) => void;
}

const PREDEFINED_COLORS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'];

export default function AddMemberModal({ visible, onClose, onAdd }: AddMemberModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [themeColor, setThemeColor] = useState(PREDEFINED_COLORS[0]);
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setName('');
      setIcon('');
      setThemeColor(PREDEFINED_COLORS[0]);
      setError('');
    }
  }, [visible]);

  const handleAdd = () => {
    if (!name.trim()) {
      setError(t.nameRequired || 'Name is required');
      return;
    }
    
    const finalIcon = icon.trim() || '👤';
    onAdd(name.trim(), finalIcon, themeColor);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.title}>{t.addMemberTitle || 'Add Member'}</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t.nameLabel || 'Name'}</Text>
                <TextInput
                  style={[styles.input, error ? styles.inputError : null]}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setError('');
                  }}
                  placeholder={t.namePlaceholder || 'Enter member name'}
                  placeholderTextColor="#9ca3af"
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t.iconLabel || 'Icon (Emoji)'}</Text>
                <TextInput
                  style={styles.input}
                  value={icon}
                  onChangeText={setIcon}
                  placeholder={t.iconPlaceholder || '👤'}
                  placeholderTextColor="#9ca3af"
                  maxLength={2}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t.themeColorLabel || 'Theme Color'}</Text>
                <View style={styles.colorPicker}>
                  {PREDEFINED_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        themeColor === color && styles.colorSelected,
                      ]}
                      onPress={() => setThemeColor(color)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>{t.cancel || 'Cancel'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.addButton]} onPress={handleAdd}>
                  <Text style={styles.addButtonText}>{t.add || 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1f2937',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  colorPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: '#1f2937',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#3b82f6',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
