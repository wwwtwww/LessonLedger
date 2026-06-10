import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Modal, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import { useDashboard } from '../hooks/useDashboard';
import { useLanguage } from '../contexts/LanguageContext';
import AppHeader from '../components/ui/AppHeader';
import { LogItem } from '../types';

export default function LogsScreen() {
  const { t } = useLanguage();
  const { logs, allClasses, members } = useDashboard();
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

  // Simple grouping by day
  const groupedLogs = logs.reduce((acc, log) => {
    const datePart = log.time.split(' ')[0] || log.time;
    let groupName = datePart;
    const today = new Date().toISOString().split('T')[0];
    if (datePart === today) groupName = t.today;

    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(log);
    return acc;
  }, {} as Record<string, LogItem[]>);

  const headerRight = (
    <TouchableOpacity style={styles.filterBtn}>
      <Text style={styles.filterText}>{t.allMembersFilter}</Text>
      <Feather name="chevron-down" size={16} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  const renderLogDetail = () => {
    if (!selectedLog) return null;
    const classItem = allClasses.find(c => c.id === selectedLog.classId);
    const member = members.find(m => m.id === classItem?.memberId);

    let courseName = classItem?.name || selectedLog.text;
    let memberName = member?.name || 'Member';

    if (!classItem && selectedLog.text.includes(' -> ')) {
      const match = selectedLog.text.match(/\[(.*?)\] (.*?) ->/);
      if (match) {
        memberName = match[1];
        courseName = match[2];
      }
    }

    const unitText = classItem?.unitType === 'session' ? t.unitSession : t.unitLesson;

    return (
      <Modal visible={!!selectedLog} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setSelectedLog(null)} style={styles.iconBtn}>
                <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.detailTitle}>{t.checkInDetail}</Text>
              <View style={styles.iconBtn} />
            </View>

            <View style={styles.successIconContainer}>
              <View style={styles.successIcon}>
                <Feather name="check" size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.successText}>{t.checkInSuccess}</Text>
            </View>

            <View style={styles.detailList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t.courseLabel}</Text>
                <Text style={styles.detailValue}>{courseName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t.memberLabel}</Text>
                <Text style={styles.detailValue}>{memberName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t.changeLabel}</Text>
                <Text style={styles.detailValue}>-1 {unitText}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t.timeLabel}</Text>
                <Text style={styles.detailValue}>{selectedLog.time}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t.noteLabel}</Text>
                <Text style={styles.detailValue}>{t.classPractice}</Text>
              </View>
            </View>

            <View style={styles.hapticFeedback}>
               <Feather name="activity" size={16} color="#94A3B8" />
               <Text style={styles.hapticText}>{t.hapticFeedback}</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.headerWrapper}>
         <AppHeader title={t.logs} rightComponent={headerRight} showBack />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {Object.entries(groupedLogs).map(([groupName, groupLogs]) => (
          <View key={groupName} style={styles.group}>
            <Text style={styles.groupTitle}>{groupName}</Text>
            {groupLogs.map(log => {
              const classItem = allClasses.find(c => c.id === log.classId);
              const member = members.find(m => m.id === classItem?.memberId);

              let courseName = classItem?.name;
              let memberName = member?.name;
              let avatar = member?.icon || '📝';

              if (!courseName) {
                const match = log.text.match(/\[(.*?)\] (.*?) ->/);
                if (match) {
                  memberName = match[1];
                  courseName = match[2];
                  const foundMember = members.find(m => m.name === memberName);
                  if (foundMember) avatar = foundMember.icon;
                } else {
                  courseName = log.text;
                }
              }

              return (
                <TouchableOpacity key={log.id} style={styles.logItem} onPress={() => setSelectedLog(log)}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{avatar}</Text>
                  </View>
                  <View style={styles.contentContainer}>
                    <Text style={styles.courseName} numberOfLines={1}>{courseName}</Text>
                    <Text style={styles.subText}>{memberName || 'Member'} · -1 {classItem?.unitType === 'session' ? t.unitSession : t.unitLesson}</Text>
                  </View>
                  <View style={styles.rightContainer}>
                    <Text style={styles.timeText}>{log.time.split(' ')[1] || log.time}</Text>
                    {classItem && (
                       <Text style={styles.subText}>{t.remain} {classItem.totalLessons - classItem.doneLessons}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {renderLogDetail()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerWrapper: { height: 56, paddingHorizontal: 4 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4, marginRight: 8 },       
  filterText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  listContainer: { padding: 16, maxWidth: 430, width: '100%', alignSelf: 'center' },
  group: { marginBottom: 24 },
  groupTitle: { fontSize: 13, color: '#94A3B8', fontWeight: '500', marginBottom: 12, marginLeft: 8 },
  logItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0,
 height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 20 },
  contentContainer: { flex: 1, justifyContent: 'center' },
  courseName: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  subText: { fontSize: 13, color: COLORS.textSecondary },
  rightContainer: { alignItems: 'flex-end', justifyContent: 'center' },
  timeText: { fontSize: 14, color: COLORS.textPrimary, marginBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: COLORS.background },
  detailCard: { flex: 1, backgroundColor: COLORS.background, paddingTop: Platform.OS === 'ios' ? 44 : 0 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 44, marginTop: 8 },
  detailTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  successIconContainer: { alignItems: 'center', marginVertical: 40 },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  successText: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary },
  detailList: { backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 20, padding: 20, gap: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 15, color: COLORS.textSecondary },
  detailValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  hapticFeedback: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 40, gap: 8 },
  hapticText: { fontSize: 13, color: '#94A3B8' }
});
