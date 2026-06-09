import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useLanguage } from '../../contexts/LanguageContext';
import { Member, ClassItem, ScheduleEntry } from '../../types';
import SchedulePicker from '../ui/SchedulePicker';

interface AddClassSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: Partial<ClassItem> & { name: string; memberId: string; totalPrice: number; totalLessons: number; schedule: ScheduleEntry[]; unitType: 'lesson' | 'session' }) => void;
  members: Member[];
  initialData?: ClassItem | null;
}

export default function AddClassSheet({ visible, onClose, onAdd, members, initialData }: AddClassSheetProps) {
  const { lang, t } = useLanguage();
  const [name, setName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [totalLessons, setTotalLessons] = useState('');
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [unitType, setUnitType] = useState<'lesson' | 'session'>('lesson');
  const [error, setError] = useState('');
  const prevVisible = useRef(visible);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['90%'], []);

  // Native Side: Sync BottomSheet
  useEffect(() => {
    if (Platform.OS !== 'web') {
      if (visible) {
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
        setMemberId(initialData.memberId);
        setTotalPrice(initialData.totalPrice.toString());
        setTotalLessons(initialData.totalLessons.toString());
        setUnitType(initialData.unitType || 'lesson');
        
        let parsedSchedule: ScheduleEntry[] = [];
        if (typeof initialData.schedule === 'string') {
          parsedSchedule = [{ type: 'specific', time: initialData.schedule }];
        } else if (Array.isArray(initialData.schedule)) {
          parsedSchedule = initialData.schedule;
        }
        setSchedule(parsedSchedule);
      } else {
        setName('');
        setMemberId(members.length > 0 ? members[0].id : '');
        setTotalPrice('');
        setTotalLessons('');
        setSchedule([]);
        setUnitType('lesson');
      }
      setError('');
    }
    prevVisible.current = visible;
  }, [visible, initialData, members]);

  const handleAdd = () => {
    if (!name.trim() || !memberId || !totalPrice || !totalLessons) {
      setError(t.allFieldsRequired || 'All fields are required');
      return;
    }
    
    onAdd({
      ...(initialData?.id ? { id: initialData.id } : {}),
      name: name.trim(),
      memberId,
      totalPrice: Number(totalPrice),
      totalLessons: Number(totalLessons),
      schedule,
      unitType,
    });
  };

  const renderFormContent = () => (
    <View style={styles.modalContent}>
      <Text style={styles.title}>
        {initialData ? t.editCourseTitle : t.addCourseTitle}
      </Text>
        
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t.courseName || 'Course Name'}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Piano"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t.bindMember || 'Bind Member'}</Text>
        <View style={styles.memberPicker}>
          {members.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.memberChip,
                memberId === m.id && { backgroundColor: m.themeColor, borderColor: m.themeColor },
              ]}
              onPress={() => setMemberId(m.id)}
            >
              <Text style={[styles.memberChipText, memberId === m.id && { color: '#fff' }]}>
                {m.icon} {m.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>{t.cost || 'Total Cost'}</Text>
          <TextInput
            style={styles.input}
            value={totalPrice}
            onChangeText={setTotalPrice}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.label}>{t.totalHours || 'Total Lessons'}</Text>
          <TextInput
            style={styles.input}
            value={totalLessons}
            onChangeText={setTotalLessons}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t.unitLabel || 'Unit Type'}</Text>
        <View style={styles.unitPicker}>
          <TouchableOpacity 
            style={[styles.unitBtn, unitType === 'lesson' && styles.unitBtnActive]} 
            onPress={() => setUnitType('lesson')}
          >
            <Text style={[styles.unitBtnText, unitType === 'lesson' && styles.unitBtnTextActive]}>{t.unitLesson}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.unitBtn, unitType === 'session' && styles.unitBtnActive]} 
            onPress={() => setUnitType('session')}
          >
            <Text style={[styles.unitBtnText, unitType === 'session' && styles.unitBtnTextActive]}>{t.unitSession}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t.schedule || 'Schedule'}</Text>
        <SchedulePicker value={schedule} onChange={setSchedule} />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
          <View style={[styles.webSheet, { paddingBottom: 40 }]}>
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
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetScrollView style={{ flex: 1 }}>
        {renderFormContent()}
      </BottomSheetScrollView>
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
  memberPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  memberChipText: {
    fontSize: 14,
    color: '#4b5563',
  },
  row: {
    flexDirection: 'row',
  },
  unitPicker: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  unitBtnActive: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  unitBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  unitBtnTextActive: {
    color: '#0F172A',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 56, // Fixed height
    borderRadius: 16, // Fixed radius
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
    backgroundColor: '#6366F1', // Primary color
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Bottom Sheet Styles
  handleIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
  },
  sheetBackground: {
    borderRadius: 32,
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
    borderTopLeftRadius: 32, // Fixed radius
    borderTopRightRadius: 32, // Fixed radius
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