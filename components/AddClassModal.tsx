import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useLanguage } from '../contexts/LanguageContext';
import { Member, ClassItem } from '../types';

interface AddClassModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: Partial<ClassItem> & { name: string; memberId: string; totalPrice: number; totalLessons: number; schedule: string; unitType: 'lesson' | 'session' }) => void;
  members: Member[];
  initialData?: ClassItem | null;
}

export default function AddClassModal({ visible, onClose, onAdd, members, initialData }: AddClassModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [totalLessons, setTotalLessons] = useState('');
  const [schedule, setSchedule] = useState('');
  const [unitType, setUnitType] = useState<'lesson' | 'session'>('lesson');
  const [errors, setErrors] = useState<{ name?: string; memberId?: string }>({});
  
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['90%'], []);
  const prevVisible = useRef(visible);

  useEffect(() => {
    if (visible && !prevVisible.current) {
      if (initialData) {
        setName(initialData.name);
        setMemberId(initialData.memberId);
        setTotalPrice(initialData.totalPrice.toString());
        setTotalLessons(initialData.totalLessons.toString());
        setSchedule(initialData.schedule);
        setUnitType(initialData.unitType || 'lesson');
      } else {
        setName('');
        setMemberId('');
        setTotalPrice('');
        setTotalLessons('');
        setSchedule('');
        setUnitType('lesson');
      }
      setErrors({});
    }
    prevVisible.current = visible;
  }, [visible, initialData]);

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ),
    []
  );

  const handleAdd = () => {
    const newErrors: { name?: string; memberId?: string } = {};
    if (!name.trim()) newErrors.name = t.nameRequired || 'Course name is required';
    if (!memberId) newErrors.memberId = t.memberRequired || 'Please select a member';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const priceNum = parseFloat(totalPrice) || 0;
    const lessonsNum = parseInt(totalLessons, 10) || 0;

    onAdd({
      ...(initialData?.id ? { id: initialData.id } : {}),
      name: name.trim(),
      memberId,
      totalPrice: priceNum,
      totalLessons: lessonsNum,
      schedule: schedule.trim(),
      unitType,
    });
  };

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      keyboardBlurBehavior="restore"
    >
      <View style={styles.modalContent}>
        <BottomSheetScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>
                {initialData ? t.editCourseTitle : t.addCourse}
              </Text>
                
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t.courseName || 'Course Name'} *</Text>
                <TextInput
                  style={[styles.input, errors.name ? styles.inputError : null]}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholder={t.courseNamePlaceholder || 'e.g. Piano, English'}
                  placeholderTextColor="#9ca3af"
                />
                {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t.bindMember || 'Bind Member'} *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberSelectorRow}>
                  {members.map(m => {
                    const isSelected = memberId === m.id;
                    return (
                      <TouchableOpacity 
                        key={m.id} 
                        style={[
                          styles.memberTab, 
                          isSelected && { backgroundColor: m.themeColor, borderColor: 'transparent' }
                        ]} 
                        onPress={() => {
                          setMemberId(m.id);
                          if (errors.memberId) setErrors({ ...errors, memberId: undefined });
                        }}
                      >
                        <Text style={[styles.memberTabText, isSelected && styles.memberTabTextActive]}>
                          {m.icon} {m.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {errors.memberId ? <Text style={styles.errorText}>{errors.memberId}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t.unitLabel || 'Unit Type'}</Text>
                <View style={styles.unitSelector}>
                  <TouchableOpacity 
                    style={[styles.unitButton, unitType === 'lesson' && styles.unitButtonActive]}
                    onPress={() => setUnitType('lesson')}
                  >
                    <Text style={[styles.unitButtonText, unitType === 'lesson' && styles.unitButtonTextActive]}>
                      {t.unitLesson}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.unitButton, unitType === 'session' && styles.unitButtonActive]}
                    onPress={() => setUnitType('session')}
                  >
                    <Text style={[styles.unitButtonText, unitType === 'session' && styles.unitButtonTextActive]}>
                      {t.unitSession}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.flex1, { marginRight: 10 }]}>
                  <Text style={styles.label}>{t.cost || 'Total Cost'}</Text>
                  <TextInput
                    style={styles.input}
                    value={totalPrice}
                    onChangeText={setTotalPrice}
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputContainer, styles.flex1]}>
                  <Text style={styles.label}>{t.totalHours || 'Total Hours'}</Text>
                  <TextInput
                    style={styles.input}
                    value={totalLessons}
                    onChangeText={setTotalLessons}
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t.schedule || 'Schedule'}</Text>
                <TextInput
                  style={styles.input}
                  value={schedule}
                  onChangeText={setSchedule}
                  placeholder={t.schedulePlaceholder || 'e.g. Sat 14:00'}
                  placeholderTextColor="#9ca3af"
                />
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
            </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '90%',
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
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
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
  memberSelectorRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  memberTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  memberTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  memberTabTextActive: {
    color: '#FFFFFF',
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  unitButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  unitButtonTextActive: {
    color: '#3b82f6',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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