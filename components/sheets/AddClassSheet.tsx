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
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useLanguage } from '../../contexts/LanguageContext';
import { Member, ClassItem, ScheduleEntry } from '../../types';
import SchedulePicker from '../ui/SchedulePicker';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../utils/colors';

interface AddClassSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: Partial<ClassItem> & { name: string; memberId: string; totalPrice: number; totalLessons: number; schedule: ScheduleEntry[]; unitType: 'lesson' | 'session' }) => void;
  members: Member[];
  initialData?: ClassItem | null;
}

export default function AddClassSheet({ visible, onClose, onAdd, members, initialData }: AddClassSheetProps) {
  const { lang } = useLanguage();
  const [step, setStep] = useState(1);
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
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ),
    []
  );

  useEffect(() => {
    if (visible && !prevVisible.current) {
      setStep(1);
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

  const handleNext = () => {
    if (!name.trim() || !memberId || !totalPrice || !totalLessons) {
      setError(lang === 'zh-CN' ? '请填写完整信息' : 'All fields are required');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSaveSchedule = () => {
    setStep(3);
  };

  const handleAdd = () => {
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

  const getMemberName = () => members.find(m => m.id === memberId)?.name || '';

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
          <Feather name="x" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{initialData ? (lang === 'zh-CN' ? '编辑课程' : 'Edit Course') : (lang === 'zh-CN' ? '添加课程' : 'Add Course')}</Text>
        <View style={styles.iconBtn} />
      </View>
        
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{lang === 'zh-CN' ? '课程名称' : 'Course Name'}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={lang === 'zh-CN' ? "请输入课程名称" : "Course Name"}
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{lang === 'zh-CN' ? '选择成员' : 'Select Member'}</Text>
        <View style={styles.memberPicker}>
          <TouchableOpacity style={styles.selectRow}>
            <Text style={styles.selectText}>{getMemberName() || (lang === 'zh-CN' ? '请选择' : 'Select')}</Text>
            <Feather name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{lang === 'zh-CN' ? '单位类型' : 'Unit Type'}</Text>
        <View style={styles.unitTabs}>
          <TouchableOpacity 
            style={[styles.unitTab, unitType === 'lesson' && styles.unitTabActive]} 
            onPress={() => setUnitType('lesson')}
          >
            <Text style={[styles.unitTabText, unitType === 'lesson' && styles.unitTabTextActive]}>{lang === 'zh-CN' ? '课时' : 'Lessons'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.unitTab, unitType === 'session' && styles.unitTabActive]} 
            onPress={() => setUnitType('session')}
          >
            <Text style={[styles.unitTabText, unitType === 'session' && styles.unitTabTextActive]}>{lang === 'zh-CN' ? '次数' : 'Sessions'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 16 }]}>
          <Text style={styles.label}>{lang === 'zh-CN' ? '总课时' : 'Total Lessons'}</Text>
          <TextInput
            style={styles.input}
            value={totalLessons}
            onChangeText={setTotalLessons}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>{lang === 'zh-CN' ? '总费用 (元)' : 'Total Cost'}</Text>
          <TextInput
            style={styles.input}
            value={totalPrice}
            onChangeText={setTotalPrice}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
        <Text style={styles.primaryBtnText}>{lang === 'zh-CN' ? '下一步: 设置时间' : 'Next: Set Time'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
          <Feather name="x" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{lang === 'zh-CN' ? '设置上课时间' : 'Set Schedule'}</Text>
        <View style={styles.iconBtn} />
      </View>

      <SchedulePicker value={schedule} onChange={setSchedule} />

      <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={handleSaveSchedule}>
        <Text style={styles.primaryBtnText}>{lang === 'zh-CN' ? '保存' : 'Save'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
          <Feather name="x" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{lang === 'zh-CN' ? '添加课程' : 'Add Course'}</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.summaryList}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{lang === 'zh-CN' ? '课程名称' : 'Course Name'}</Text>
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryValue}>{name}</Text>
            <Feather name="chevron-right" size={20} color="#94A3B8" />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{lang === 'zh-CN' ? '选择成员' : 'Member'}</Text>
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryValue}>{getMemberName()}</Text>
            <Feather name="chevron-right" size={20} color="#94A3B8" />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{lang === 'zh-CN' ? '单位类型' : 'Unit Type'}</Text>
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryValue}>{unitType === 'lesson' ? (lang === 'zh-CN' ? '课时' : 'Lesson') : (lang === 'zh-CN' ? '次数' : 'Session')}</Text>
            <Feather name="chevron-right" size={20} color="#94A3B8" />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{lang === 'zh-CN' ? '总课时' : 'Total Lessons'}</Text>
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryValue}>{totalLessons}</Text>
            <Feather name="chevron-right" size={20} color="#94A3B8" />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{lang === 'zh-CN' ? '总费用' : 'Total Cost'}</Text>
          <View style={styles.summaryValueRow}>
            <Text style={styles.summaryValue}>{totalPrice}</Text>
            <Feather name="chevron-right" size={20} color="#94A3B8" />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>{lang === 'zh-CN' ? '上课时间' : 'Schedule'}</Text>
            <Text style={styles.summarySub}>{schedule.length} rules set</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#94A3B8" />
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleAdd}>
        <Text style={styles.primaryBtnText}>{lang === 'zh-CN' ? '保存课程' : 'Save Course'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (step === 1) return renderStep1();
    if (step === 2) return renderStep2();
    if (step === 3) return renderStep3();
  };

  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
        <View style={styles.webOverlay}>
          <TouchableOpacity style={styles.webDismissArea} activeOpacity={1} onPress={onClose} />
          <View style={[styles.webSheet, { paddingBottom: 40 }]}>
            <View style={styles.handle} />
            {renderContent()}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      keyboardBlurBehavior="restore"
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetScrollView style={{ flex: 1 }}>
        {renderContent()}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  stepContainer: { paddingHorizontal: 24, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: '#64748B', marginBottom: 8 },
  input: { borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 12, fontSize: 16, color: COLORS.textPrimary },
  selectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 12 },
  memberPicker: { marginBottom: 8 },
  selectText: { fontSize: 16, color: COLORS.textPrimary },
  unitTabs: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 },
  unitTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  unitTabActive: { backgroundColor: COLORS.primary },
  unitTabText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  unitTabTextActive: { color: '#FFFFFF' },
  row: { flexDirection: 'row' },
  primaryBtn: { backgroundColor: COLORS.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#EF4444', fontSize: 12, marginBottom: 16, textAlign: 'center' },
  summaryList: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 16, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  summaryLabel: { fontSize: 15, color: COLORS.textSecondary },
  summaryValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  summarySub: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#E2E8F0' },
  handle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  sheetBackground: { borderRadius: 32 },
  webOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  webDismissArea: { flex: 1 },
  webSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, width: '100%', maxWidth: 600, alignSelf: 'center' },
});