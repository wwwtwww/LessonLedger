import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ClassItem, Member, LogItem } from '../../types';
import { COLORS } from '../../utils/colors';
import { useLanguage } from '../../contexts/LanguageContext';
import ClassCheckInCard from './ClassCheckInCard';

interface TodayClassesProps {
  allClasses: ClassItem[];
  members: Member[];
  logs: LogItem[];
  onCheckIn: (classId: string, className: string, memberName: string) => void;
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
  const dateStr = today.toISOString().slice(0, 10);

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
    const dateStr = date.toISOString().slice(0, 10);
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

export default function TodayClasses({ allClasses, members, logs, onCheckIn }: TodayClassesProps) {
  const { t } = useLanguage();
  const router = useRouter();

  const todayClasses = useMemo(() => getTodayClasses(allClasses), [allClasses]);
  const upcomingGroups = useMemo(() => getUpcomingClasses(allClasses), [allClasses]);
  const activeClasses = allClasses.filter(c => !c.isDeleted && c.doneLessons < c.totalLessons);

  const handleCheckIn = (classId: string) => {
    const cls = allClasses.find(c => c.id === classId);
    if (!cls) return;
    const member = members.find(m => m.id === cls.memberId);
    onCheckIn(classId, cls.name, member?.name || 'Unknown');
  };

  const renderCard = (cls: ClassItem) => {
    const member = members.find(m => m.id === cls.memberId);
    return (
      <ClassCheckInCard
        key={cls.id}
        classItem={cls}
        member={member}
        isCheckedIn={isCheckedInToday(cls.id, logs)}
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
        <Text style={styles.sectionTitle}>
          📅 {t.todayClasses}{' '}
          {allCheckedIn ? '— 全部完成 ✅' : `(${todayClasses.length}门)`}
        </Text>
        {todayClasses.map(renderCard)}
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
        <Text style={styles.sectionTitle}>📅 {t.upcomingClasses}</Text>
        <Text style={styles.hintText}>{t.noClassToday}</Text>
        {upcomingGroups.slice(0, 3).map(group => (
          <View key={group.date}>
            <Text style={styles.dateGroupLabel}>{group.date}</Text>
            {group.classes.map(renderCard)}
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
});
