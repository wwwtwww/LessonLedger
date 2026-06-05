import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useLanguage } from '../contexts/LanguageContext';
import { Member } from '../types';

interface AddMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: Partial<Member> & { name: string; icon: string; themeColor: string }) => void;
  initialData?: Member | null;
}

const PREDEFINED_COLORS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'];

export default function AddMemberModal({ visible, onClose, onAdd, initialData }: AddMemberModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [themeColor, setThemeColor] = useState(PREDEFINED_COLORS[0]);
  const [error, setError] = useState('');
  const prevVisible = useRef(visible);
  
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['75%'], []);

  // Native Side: Sync BottomSheet
  useEffect(() => {
    if (Platform.OS !== 'web') {
      if (visible) {
        Alert.alert('Debug', 'AddMemberModal is trying to present BottomSheet');
        bottomSheetModalRef.current?.present();
      } else {
        bottomSheetModalRef.current?.dismiss();
      }
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ),
    []
  );

  // Reset state when modal opens
  useEffect(() => {
    if (visible && !prevVisible.current) {
      if (initialData) {
        setName(initialData.name);
        setIcon(initialData.icon);
        setThemeColor(initialData.themeColor);
      } else {
        setName('');
        setIcon('');
        setThemeColor(PREDEFINED_COLORS[0]);
      }
      setError('');
    }
    prevVisible.current = visible;
  }, [visible, initialData]);

  const handleAdd = () => {
    if (!name.trim()) {
      setError(t.nameRequired || 'Name is required');
      return;
    }
    
    const finalIcon = icon.trim() || '👤';
    onAdd({
      ...(initialData?.id ? { id: initialData.id } : {}),
      name: name.trim(),
      icon: finalIcon,
      themeColor,
    });
  };

  const renderFormContent = () => (
    <View style={styles.modalContent}>
      <Text style={styles.title}>
        {initialData ? t.editMemberTitle : t.addMemberTitle}
      </Text>
        
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
          <Text style={styles.addButtonText}>
            {initialData ? t.save : t.add}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Web Fallback
  if (Platform.OS === 'web') {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.webOverlay}>
          <TouchableOpacity style={styles.webDismissArea} activeOpacity={1} onPress={onClose} />
          <View style={styles.webSheet}>
            <View style={styles.webHandle} />
            {renderFormContent()}
          </View>
        </View>
      </Modal>
    );
  }

  // Native: BottomSheet
  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={{ flex: 1 }}>
        {renderFormContent()}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
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
  // Web Specific Styles
  webOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  webDismissArea: {
    flex: 1,
  },
  webSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  webHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
});