import React, { useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { ClassItem, Member } from '../../types';
import { COLORS } from '../../utils/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';

interface ClassCheckInCardProps {
  classItem: ClassItem;
  member?: Member;
  isCheckedIn: boolean;
  onCheckIn: (classId: string) => void;
}

export default function ClassCheckInCard({ classItem, member, isCheckedIn, onCheckIn }: ClassCheckInCardProps) {
  const { t } = useLanguage();
  const remaining = classItem.totalLessons - classItem.doneLessons;
  const isUrgent = remaining <= 3;
  const unitText = classItem.unitType === 'session' ? t.unitSession : t.unitLesson;
  const scheduleTime = classItem.schedule[0]?.time || '';

  const handlePress = useCallback(() => {
    if (isCheckedIn) return;
    triggerHaptic('light');
    onCheckIn(classItem.id);
  }, [isCheckedIn, classItem.id, onCheckIn]);

  const cardStyle = isCheckedIn
    ? [styles.card, styles.cardDone]
    : isUrgent
      ? [styles.card, styles.cardWarning]
      : styles.card;

  const btnStyle = isCheckedIn
    ? [styles.checkInBtn, styles.checkInBtnDone]
    : isUrgent
      ? [styles.checkInBtn, styles.checkInBtnUrgent]
      : [styles.checkInBtn, styles.checkInBtnNormal];

  const btnTextStyle = isCheckedIn
    ? [styles.checkInBtnText, styles.checkInBtnTextDone]
    : styles.checkInBtnText;

  return (
    <View style={cardStyle}>
      <View style={styles.leftContent}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: isCheckedIn
                ? '#F1F5F9'
                : isUrgent
                  ? '#FEE2E2'
                  : member?.themeColor ? `${member.themeColor}15` : '#EEF2FF',
            },
          ]}
        >
          <Text style={styles.avatarText}>{member?.icon || '📚'}</Text>
        </View>
        <View style={styles.textGroup}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName} numberOfLines={1}>
              {member?.name || 'Member'}
            </Text>
            <Text
              style={[
                styles.courseName,
                isCheckedIn && styles.courseNameDone,
              ]}
              numberOfLines={1}
            >
              {classItem.name}
            </Text>
          </View>
          <Text style={[styles.metaText, isUrgent && styles.metaTextUrgent]}>
            {scheduleTime ? `${scheduleTime} · ` : ''}
            {t.remain} {remaining} {unitText}
            {isUrgent && !isCheckedIn ? ' ⚠️' : ''}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={btnStyle} onPress={handlePress} disabled={isCheckedIn}>
        <Text style={btnTextStyle}>
          {isCheckedIn ? t.checkedIn : t.btnCheckIn}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  cardWarning: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FECACA',
  },
  cardDone: {
    backgroundColor: '#F8FAFC',
    opacity: 0.65,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
  },
  textGroup: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  memberName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  courseName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  courseNameDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  metaText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  metaTextUrgent: {
    color: '#EF4444',
    fontWeight: '600',
  },
  checkInBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInBtnNormal: {
    backgroundColor: COLORS.primary,
  },
  checkInBtnUrgent: {
    backgroundColor: '#EF4444',
  },
  checkInBtnDone: {
    backgroundColor: '#E2E8F0',
  },
  checkInBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  checkInBtnTextDone: {
    color: '#94A3B8',
  },
});
