import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { ClassItem, Member } from '../../types';
import { formatSchedule } from '../../utils/formatters';
import { triggerHaptic } from '../../utils/haptics';
import { COLORS } from '../../utils/colors';

interface ClassCardProps {
  classItem: ClassItem;
  owner?: Member;
  onCheckIn: (classId: string, className: string, memberName: string) => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ classItem, owner, onCheckIn }) => {
  const { t, lang } = useLanguage();
  const ownerName = owner?.name || '未知';
  const ownerIcon = owner?.icon || '👤';
  const themeColor = owner?.themeColor || COLORS.primary;

  const isCompleted = classItem.doneLessons >= classItem.totalLessons;
  const progress = classItem.totalLessons > 0
    ? Math.min(classItem.doneLessons / classItem.totalLessons, 1)
    : 0;

  const handleCheckInPress = () => {
    triggerHaptic('light');
    if (isCompleted) {
      const errorMsg = t.noRemainingError;
      if (Platform.OS === 'web') alert(errorMsg);
      else Alert.alert('', errorMsg);
      return;
    }
    onCheckIn(classItem.id, classItem.name, ownerName);
  };
  const unitText = classItem.unitType === 'lesson' ? t.unitLesson : t.unitSession;
  const costPerUnit = classItem.totalLessons > 0 
    ? (classItem.totalPrice / classItem.totalLessons).toFixed(1) 
    : '0';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleArea}>
          <Text style={styles.className}>{classItem.name}</Text>
          <View style={[styles.ownerTag, { backgroundColor: themeColor + '20' }]}>
            <Text style={[styles.ownerTagText, { color: themeColor }]}>
              {ownerIcon} {ownerName}
            </Text>
          </View>
        </View>
        <Text style={styles.costInfo}>￥{costPerUnit} / {unitText}</Text>
      </View>

      <View style={styles.scheduleRow}>
        <Text style={styles.scheduleText}>
          🕒 {t.schedule}: {formatSchedule(classItem.schedule, lang as 'zh-CN' | 'en-US')}
        </Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>
            {t.alreadyUp} <Text style={styles.highlight}>{classItem.doneLessons}</Text> / {t.total} {classItem.totalLessons}
          </Text>
          <Text style={styles.remainingText}>
            {t.remain} <Text style={styles.highlight}>{classItem.totalLessons - classItem.doneLessons}</Text> {unitText}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progress * 100}%`, backgroundColor: isCompleted ? '#10B981' : themeColor }
            ]} 
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.checkInBtn, isCompleted && styles.checkInBtnDisabled]} 
        onPress={handleCheckInPress}
        disabled={isCompleted}
      >
        <Text style={styles.checkInBtnText}>
          {isCompleted ? t.btnCompleted : t.btnCheckIn}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  titleArea: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  className: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  ownerTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  ownerTagText: { fontSize: 12, fontWeight: '600' },
  costInfo: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 4 },
  scheduleRow: { marginBottom: 12 },
  scheduleText: { fontSize: 13, color: '#475569' },
  progressSection: { marginBottom: 16 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { fontSize: 13, color: '#64748B' },
  remainingText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  highlight: { color: '#0F172A', fontWeight: 'bold' },
  progressBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  checkInBtn: { backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  checkInBtnDisabled: { backgroundColor: '#10B981' },
  checkInBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
});

export default ClassCard;