import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface Member {
  id: string;
  name: string;
  icon: string;
  themeColor: string;
}

interface AddClassModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (classItem: { name: string; memberId: string; totalPrice: number; totalLessons: number; schedule: string }) => void;
  members: Member[];
  t: Record<string, string>;
}

export default function AddClassModal({ visible, onClose, onAdd, members, t }: AddClassModalProps) {
  const [name, setName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [totalLessons, setTotalLessons] = useState('');
  const [schedule, setSchedule] = useState('');
  const [errors, setErrors] = useState<{ name?: string; memberId?: string }>({});

  useEffect(() => {
    if (visible) {
      setName('');
      setMemberId('');
      setTotalPrice('');
      setTotalLessons('');
      setSchedule('');
      setErrors({});
    }
  }, [visible]);

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
      name: name.trim(),
      memberId,
      totalPrice: priceNum,
      totalLessons: lessonsNum,
      schedule: schedule.trim(),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <Text style={styles.title}>{t.addCourse || 'Add Course'}</Text>
              
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
                  <Text style={styles.addButtonText}>{t.add || 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
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