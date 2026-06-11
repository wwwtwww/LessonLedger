import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import { useDashboard } from '../hooks/useDashboard';
import { useLanguage } from '../contexts/LanguageContext';
import AppHeader from '../components/ui/AppHeader';
import SwipeableItem from '../components/ui/SwipeableItem';
import { formatSchedule } from '../utils/formatters';
import AddClassSheet from '../components/sheets/AddClassSheet';
import { ClassItem, ScheduleEntry } from '../types';

export default function CoursesScreen() {
  const { t, lang } = useLanguage();
  const { allClasses, members, handleDeleteClass, handleAddClass, handleUpdateClass } = useDashboard();
  const [activeTab, setActiveTab] = useState('all');
  const [isAddClassVisible, setIsAddClassVisible] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  const tabs = [
    { key: 'all', label: t.all },
    { key: 'active', label: t.active },
    { key: 'completed', label: t.completed },
    { key: 'deleted', label: t.deleted },
  ];

  const filteredClasses = allClasses.filter(c => {
    if (activeTab === 'deleted') return c.isDeleted;
    if (c.isDeleted) return false;
    if (activeTab === 'active') return c.doneLessons < c.totalLessons;
    if (activeTab === 'completed') return c.doneLessons >= c.totalLessons;
    return true;
  });

  const onSaveClass = (data: { id?: string; name: string; memberId: string; totalPrice: number; totalLessons: number; schedule: ScheduleEntry[]; unitType: 'lesson' | 'session' }) => {
    if (data.id) {
      handleUpdateClass(data.id, data);
    } else {
      handleAddClass(data);
    }
    setIsAddClassVisible(false);
    setEditingClass(null);
  };

  const headerRight = (
    <View style={styles.headerRight}>
      <TouchableOpacity style={styles.iconBtn} onPress={() => setIsAddClassVisible(true)}>
        <Feather name="plus" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.headerWrapper}>
         <AppHeader title={t.courses} rightComponent={headerRight} />
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity 
            key={tab.key} 
            onPress={() => setActiveTab(tab.key)}
            style={styles.tab}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.listContainer}>
        {filteredClasses.map(item => {
          const member = members.find(m => m.id === item.memberId);
          const remaining = item.totalLessons - item.doneLessons;
          const isUrgent = remaining <= 3 && remaining > 0;
          const progress = item.totalLessons > 0 ? item.doneLessons / item.totalLessons : 0;
          const unitText = item.unitType === 'session' ? t.unitSession : t.unitLesson;

          return (
            <SwipeableItem 
              key={item.id} 
              onEdit={() => {
                setEditingClass(item);
                setIsAddClassVisible(true);
              }} 
              onDelete={() => handleDeleteClass(item.id)}
            >
              <View style={styles.card}>
                <View style={styles.cardLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: member?.themeColor ? `${member.themeColor}15` : '#F1F5F9' }]}>
                    <Text style={styles.iconText}>{member?.icon || '📚'}</Text>
                  </View>
                </View>

                <View style={styles.cardMain}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.className} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.remainingText, isUrgent && { color: '#EF4444' }]}>
                      {t.remain} {remaining} {unitText}
                      <Feather name="chevron-right" size={14} color="#94A3B8" />
                    </Text>
                  </View>

                  <Text style={styles.memberText}>
                    {member?.name || 'Member'} · {formatSchedule(item.schedule, lang as 'zh-CN' | 'en-US')}
                  </Text>

                  <View style={styles.progressRow}>
                    <Text style={styles.progressText}>
                      <Text style={styles.doneText}>{item.doneLessons}</Text> / {item.totalLessons} {unitText}
                    </Text>
                    <View style={styles.costContainer}>
                      <Text style={styles.costText}>
                         {item.totalLessons > 0 ? (item.totalPrice / item.totalLessons).toFixed(1) : '0'} / {unitText}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${progress * 100}%`, backgroundColor: isUrgent ? COLORS.danger : COLORS.warning }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </SwipeableItem>
          );
        })}
      </ScrollView>

      <AddClassSheet
        visible={isAddClassVisible}
        onClose={() => { setIsAddClassVisible(false); setEditingClass(null); }}
        onAdd={onSaveClass}
        members={members}
        initialData={editingClass}
        classes={allClasses}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1, width: '100%' },
  headerWrapper: { height: 64, paddingHorizontal: 16 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tab: { marginRight: 24, paddingVertical: 12, position: 'relative' },
  tabText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
  activeTabText: { color: COLORS.textPrimary, fontWeight: '600' },
  activeTabIndicator: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, backgroundColor: '#0F172A', borderRadius: 2 },
  listContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 16, maxWidth: 860, width: '100%', alignSelf: 'center', flexGrow: 1, justifyContent: 'flex-start' },
  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16 },
  cardLeft: { marginRight: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 24 },
  cardMain: { flex: 1 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  className: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  remainingText: { fontSize: 13, fontWeight: '600', color: COLORS.warning },
  memberText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressText: { fontSize: 13, color: COLORS.textSecondary },
  doneText: { color: COLORS.textPrimary, fontWeight: '600' },
  costContainer: { flexDirection: 'row', alignItems: 'center' },
  costText: { fontSize: 12, color: '#94A3B8' },
  progressBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
});
