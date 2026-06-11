import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ClassItem, Member, LogItem } from '../../types';
import { COLORS } from '../../utils/colors';
import { toLocalDateStr } from '../../utils/formatters';
import { useLanguage } from '../../contexts/LanguageContext';
import ClassCheckInCard from './ClassCheckInCard';

interface TodayClassesProps {
  allClasses: ClassItem[];
  members: Member[];
  logs: LogItem[];
  onCheckIn: (classId: string, className: string, memberName: string, onSuccess?: (logId: string, remaining: number) => void) => void;
  onCheckInWithDate: (classId: string, className: string, memberName: string, dateStr: string, onSuccess?: (logId: string, remaining: number) => void) => void;
  onUndoCheckIn: (logId: string, classId: string) => void;
  onSkipClass: (classId: string, className: string, memberName: string) => void;
  getYesterdayMissedClasses: () => (ClassItem & { memberName: string })[];
}

function isCheckedInToday(classId: string, logs: LogItem[]): boolean {
  const today = new Date().toLocaleDateString();
  return logs.some(log => {
    const logDate = new Date(log.time).toLocaleDateString();
    return logDate === today && (log.classId === classId || log.text.includes(classId));
  });
}

function getTodayClasses(allClasses: ClassItem[]): ClassItem[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dateStr = toLocalDateStr(today);

  return allClasses.filter(c => {
    if (c.isDeleted) return false;
    if (c.doneLessons >= c.totalLessons) return false;
    if (!c.schedule || c.schedule.length === 0) return false;
    return c.schedule.some(s =>
      (s.type === 'weekly' && s.day === dayOfWeek) ||
      (s.type === 'specific' && s.date === dateStr)
    );
  });
}

function getUpcomingClasses(allClasses: ClassItem[]): { date: string; classes: ClassItem[] }[] {
  const today = new Date();
  const groups: { date: string; classes: ClassItem[] }[] = [];

  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    const dateStr = toLocalDateStr(date);
    const dateLabel = `${date.getMonth() + 1}月${date.getDate()}日`;

    const classes = allClasses.filter(c => {
      if (c.isDeleted) return false;
      if (c.doneLessons >= c.totalLessons) return false;
      if (!c.schedule || c.schedule.length === 0) return false;
      return c.schedule.some(s =>
        (s.type === 'weekly' && s.day === dayOfWeek) ||
        (s.type === 'specific' && s.date === dateStr)
      );
    });

    if (classes.length > 0) {
      groups.push({ date: dateLabel, classes });
    }
  }

  return groups;
}

export default function TodayClasses({
  allClasses, members, logs, onCheckIn, onCheckInWithDate, onUndoCheckIn, onSkipClass,
  getYesterdayMissedClasses,
}: TodayClassesProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [undoInfo, setUndoInfo] = useState<{ logId: string; classId: string; message: string } | null>(null);
  const [dismissedYesterday, setDismissedYesterday] = useState(false);

  const todayClasses = useMemo(() => getTodayClasses(allClasses), [allClasses]);
  const upcomingGroups = useMemo(() => getUpcomingClasses(allClasses), [allClasses]);
  const activeClasses = allClasses.filter(c => !c.isDeleted && c.doneLessons < c.totalLessons);
  const yesterdayMissed = useMemo(() => {
    if (dismissedYesterday) return [];
    return getYesterdayMissedClasses();
  }, [getYesterdayMissedClasses, dismissedYesterday]);

  // 撤销提示条自动消失
  useEffect(() => {
    if (undoInfo) {
      const timer = setTimeout(() => setUndoInfo(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [undoInfo]);

  // 显示撤销提示条（由 ClassCheckInCard 打卡成功后调用）
  const handleCheckIn = useCallback((classId: string) => {
    const cls = allClasses.find(c => c.id === classId);
    if (!cls) return;
    const member = members.find(m => m.id === cls.memberId);
    const memberName = member?.name || 'Unknown';

    // onSuccess 回调：仅在用户确认打卡后才显示撤销条
    onCheckIn(classId, cls.name, memberName, (logId: string, remaining: number) => {
      const unitLabel = cls.unitType === 'session'
        ? (t.unitSession === '次' ? '次' : t.unitSession)
        : (t.unitLesson === '课时' ? '课时' : t.unitLesson);
      setUndoInfo({
        logId,
        classId,
        message: `✅ 已为${cls.name}打卡 · 剩余 ${Math.max(0, remaining)} ${unitLabel}`,
      });
    });
  }, [allClasses, members, onCheckIn, t]);

  // 补打卡成功后显示撤销条（与正常打卡体验一致）
  const makeMakeupSuccessCallback = useCallback((cls: ClassItem) => {
    return (logId: string, remaining: number) => {
      const unitLabel = cls.unitType === 'session'
        ? (t.unitSession === '次' ? '次' : t.unitSession)
        : (t.unitLesson === '课时' ? '课时' : t.unitLesson);
      setUndoInfo({
        logId,
        classId: cls.id,
        message: `✅ 已为${cls.name}打卡 · 剩余 ${Math.max(0, remaining)} ${unitLabel}`,
      });
    };
  }, [t]);

  const handleLongPress = useCallback((cls: ClassItem) => {
    const member = members.find(m => m.id === cls.memberId);
    const memberName = member?.name || 'Unknown';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateStr(yesterday);

    Alert.alert(
      cls.name,
      '',
      [
        { text: t.makeupCheckIn, onPress: () => {
          onCheckInWithDate(cls.id, cls.name, memberName, yesterdayStr, makeMakeupSuccessCallback(cls));
        }},
        { text: t.skipClass, onPress: () => {
          onSkipClass(cls.id, cls.name, memberName);
        }},
        { text: t.cancel, style: 'cancel' },
      ]
    );
  }, [members, onCheckInWithDate, onSkipClass, t, makeMakeupSuccessCallback]);

  const handleYesterdayCheckIn = useCallback((cls: ClassItem & { memberName: string }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateStr(yesterday);
    onCheckInWithDate(cls.id, cls.name, cls.memberName, yesterdayStr, makeMakeupSuccessCallback(cls));
  }, [onCheckInWithDate, makeMakeupSuccessCallback]);

  const renderCard = (cls: ClassItem, isLongPressable = true) => {
    const member = members.find(m => m.id === cls.memberId);
    const checkedIn = isCheckedInToday(cls.id, logs);

    if (isLongPressable && !checkedIn) {
      return (
        <TouchableOpacity key={cls.id} onLongPress={() => handleLongPress(cls)} activeOpacity={0.9}>
          <ClassCheckInCard
            classItem={cls}
            member={member}
            isCheckedIn={checkedIn}
            onCheckIn={handleCheckIn}
          />
        </TouchableOpacity>
      );
    }

    return (
      <ClassCheckInCard
        key={cls.id}
        classItem={cls}
        member={member}
        isCheckedIn={checkedIn}
        onCheckIn={handleCheckIn}
      />
    );
  };

  if (members.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>📅 {t.todayClasses}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👋</Text>
          <Text style={styles.emptyText}>{t.addFirstMember}</Text>
        </View>
      </View>
    );
  }

  if (activeClasses.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>📅 {t.todayClasses}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>{t.addFirstClass}</Text>
        </View>
      </View>
    );
  }

  if (todayClasses.length > 0) {
    const allCheckedIn = todayClasses.every(c => isCheckedInToday(c.id, logs));
    return (
      <View style={styles.container}>
        {/* 撤销提示条 */}
        {undoInfo && (
          <View style={styles.undoBar}>
            <Text style={styles.undoText}>{undoInfo.message}</Text>
            <TouchableOpacity onPress={() => {
              onUndoCheckIn(undoInfo.logId, undoInfo.classId);
              setUndoInfo(null);
            }}>
              <Text style={styles.undoBtnText}>{t.undo}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 昨日未打卡提醒 */}
        {yesterdayMissed.length > 0 && (
          <View style={styles.yesterdayBar}>
            <Text style={styles.yesterdayText}>
              ⚠️ {t.yesterdayMissed}：
            </Text>
            <View style={styles.yesterdayClasses}>
              {yesterdayMissed.slice(0, 3).map(cls => (
                <TouchableOpacity key={cls.id} style={styles.yesterdayClassItem} onPress={() => handleYesterdayCheckIn(cls)}>
                  <Text style={styles.yesterdayClassName}>{cls.name}</Text>
                  <Text style={styles.yesterdayCheckInBtn}>{t.makeupCheckIn}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setDismissedYesterday(true)}>
              <Text style={styles.yesterdayDismiss}>{t.dismiss}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          📅 {t.todayClasses}{' '}
          {allCheckedIn ? '— 全部完成 ✅' : `(${todayClasses.length}门)`}
        </Text>
        {todayClasses.map(cls => renderCard(cls, true))}
        <TouchableOpacity style={styles.linkBar} onPress={() => router.push('/courses')}>
          <Text style={styles.linkText}>
            📋 {t.viewAllCourses} ({activeClasses.length}门)
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (upcomingGroups.length > 0) {
    return (
      <View style={styles.container}>
        {/* 昨日未打卡提醒 */}
        {yesterdayMissed.length > 0 && (
          <View style={styles.yesterdayBar}>
            <Text style={styles.yesterdayText}>
              ⚠️ {t.yesterdayMissed}：
            </Text>
            <View style={styles.yesterdayClasses}>
              {yesterdayMissed.slice(0, 3).map(cls => (
                <TouchableOpacity key={cls.id} style={styles.yesterdayClassItem} onPress={() => handleYesterdayCheckIn(cls)}>
                  <Text style={styles.yesterdayClassName}>{cls.name}</Text>
                  <Text style={styles.yesterdayCheckInBtn}>{t.makeupCheckIn}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setDismissedYesterday(true)}>
              <Text style={styles.yesterdayDismiss}>{t.dismiss}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>📅 {t.upcomingClasses}</Text>
        <Text style={styles.hintText}>{t.noClassToday}</Text>
        {upcomingGroups.slice(0, 3).map(group => (
          <View key={group.date}>
            <Text style={styles.dateGroupLabel}>{group.date}</Text>
            {group.classes.map(cls => renderCard(cls, true))}
          </View>
        ))}
        <TouchableOpacity style={styles.linkBar} onPress={() => router.push('/courses')}>
          <Text style={styles.linkText}>
            📋 {t.viewAllCourses} ({activeClasses.length}门)
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 昨日未打卡提醒 */}
      {yesterdayMissed.length > 0 && (
        <View style={styles.yesterdayBar}>
          <Text style={styles.yesterdayText}>
            ⚠️ {t.yesterdayMissed}：
          </Text>
          <View style={styles.yesterdayClasses}>
            {yesterdayMissed.slice(0, 3).map(cls => (
              <TouchableOpacity key={cls.id} style={styles.yesterdayClassItem} onPress={() => handleYesterdayCheckIn(cls)}>
                <Text style={styles.yesterdayClassName}>{cls.name}</Text>
                <Text style={styles.yesterdayCheckInBtn}>{t.makeupCheckIn}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => setDismissedYesterday(true)}>
            <Text style={styles.yesterdayDismiss}>{t.dismiss}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>📅 {t.todayClasses}</Text>
      <Text style={styles.hintText}>{t.noClassToday}</Text>
      <TouchableOpacity style={styles.linkBar} onPress={() => router.push('/courses')}>
        <Text style={styles.linkText}>
          📋 {t.viewAllCourses} ({activeClasses.length}门)
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 12 },
  hintText: { fontSize: 12, color: '#94A3B8', marginBottom: 8 },
  dateGroupLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginBottom: 6, marginTop: 4 },
  emptyState: {
    alignItems: 'center', paddingVertical: 32, backgroundColor: '#FFFFFF',
    borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed',
  },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#94A3B8' },
  linkBar: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', marginTop: 6,
  },
  linkText: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  // 撤销提示条
  undoBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  undoText: { fontSize: 12, color: '#166534', flex: 1 },
  undoBtnText: { fontSize: 13, fontWeight: '700', color: '#EF4444', marginLeft: 12 },
  // 昨日未打卡
  yesterdayBar: {
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  yesterdayText: { fontSize: 12, fontWeight: '600', color: '#92400E', marginBottom: 6 },
  yesterdayClasses: { gap: 4, marginBottom: 6 },
  yesterdayClassItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  yesterdayClassName: { fontSize: 13, fontWeight: '500', color: '#1E293B' },
  yesterdayCheckInBtn: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  yesterdayDismiss: { fontSize: 11, color: '#94A3B8', textAlign: 'right' },
});
