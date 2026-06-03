import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { Member, ClassItem } from '../../types';

interface ClassCardProps {
  classItem: ClassItem;
  owner: Member | undefined;
  onCheckIn: (classId: string, className: string, memberName: string) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ classItem, owner, onCheckIn }) => {
  const { t, lang } = useLanguage();

  const remaining = classItem.totalLessons - classItem.doneLessons;
  const progress = (classItem.doneLessons / classItem.totalLessons) * 100;
  const costPerUnit = (classItem.totalPrice / classItem.totalLessons).toFixed(1);
  const unitLabel = classItem.unitType === 'lesson' ? t.unitLesson : t.unitSession;

  // 低余额红灯预警判定 (剩余 <= 3 亮猩红灯)
  const isWarning = remaining <= 3 && remaining > 0;
  const isDone = remaining === 0;

  return (
    <View key={classItem.id} style={[styles.classCard, isWarning && styles.classCardWarning]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleGroup}>
          <Text style={styles.className}>{classItem.name}</Text>
          <Text style={[styles.memberBadge, { backgroundColor: owner?.themeColor + '20', color: owner?.themeColor }]}>
            {owner?.icon} {owner?.name}
          </Text>
        </View>
        <Text style={styles.classCost}>{lang === 'zh-CN' ? '￥' : '$'}{costPerUnit} / {unitLabel}</Text>
      </View>

      <Text style={styles.classTime}>🕒 {t.schedule}: {classItem.schedule}</Text>

      <View style={styles.lessonInfoRow}>
        <Text style={styles.lessonText}>
          {t.alreadyUp} <Text style={styles.boldText}>{classItem.doneLessons}</Text> / {t.total} {classItem.totalLessons}
        </Text>
        <Text style={styles.lessonText}>
          {t.remain} <Text style={[styles.boldText, isWarning && styles.warningText]}>{remaining}</Text> {unitLabel}
        </Text>
      </View>

      {/* 进度条 */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }, isWarning && { backgroundColor: '#EF4444' }]} />
      </View>

      {/* 打卡按钮 */}
      <TouchableOpacity 
        style={[styles.checkInBtn, { backgroundColor: owner?.themeColor }, isDone && styles.disabledBtn]} 
        onPress={() => onCheckIn(classItem.id, classItem.name, owner?.name || '')}
        disabled={isDone}
      >
        <Text style={styles.checkInBtnText}>{isDone ? t.btnCompleted : t.btnCheckIn}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  classCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
  classCardWarning: { borderColor: '#EF4444', shadowColor: '#EF4444', shadowOpacity: 0.08 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  className: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  memberBadge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  classCost: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  classTime: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  lessonInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  lessonText: { fontSize: 13, color: '#475569' },
  boldText: { fontWeight: 'bold', color: '#0F172A' },
  warningText: { color: '#EF4444', fontWeight: '900' },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginBottom: 14, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 3 },
  checkInBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#CBD5E1' },
  checkInBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

export default ClassCard;