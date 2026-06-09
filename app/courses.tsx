import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { Stack, useRouter, useNavigation } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { triggerHaptic } from '../utils/haptics';
import { COLORS } from '../utils/colors';
import { useDashboard } from '../hooks/useDashboard';
import { useLanguage } from '../contexts/LanguageContext';
import SwipeableItem from '../components/ui/SwipeableItem';
import { formatSchedule } from '../utils/formatters';

export default function CoursesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { lang } = useLanguage();

  const handleMenuPress = () => {
    triggerHaptic('light');
    navigation.dispatch(DrawerActions.toggleDrawer());
  };
  const { allClasses, members, handleDeleteClass } = useDashboard();
  const [activeTab, setActiveTab] = useState('全部');

  const tabs = [
    { key: '全部', label: lang === 'zh-CN' ? '全部' : 'All' },
    { key: '进行中', label: lang === 'zh-CN' ? '进行中' : 'Active' },
    { key: '已完成', label: lang === 'zh-CN' ? '已完成' : 'Completed' },
    { key: '已删除', label: lang === 'zh-CN' ? '已删除' : 'Deleted' },
  ];

  const filteredClasses = allClasses.filter(c => {
    if (activeTab === '已删除') return c.isDeleted;
    if (c.isDeleted) return false;
    if (activeTab === '进行中') return c.doneLessons < c.totalLessons;
    if (activeTab === '已完成') return c.doneLessons >= c.totalLessons;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleMenuPress} style={styles.iconBtn}>
          <Feather name="menu" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{lang === 'zh-CN' ? '我的课程' : 'My Courses'}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="search" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="plus" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
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

      <ScrollView contentContainerStyle={styles.listContainer}>
        {filteredClasses.map(item => {
          const member = members.find(m => m.id === item.memberId);
          const remaining = item.totalLessons - item.doneLessons;
          const isUrgent = remaining <= 3 && remaining > 0;
          const progress = item.totalLessons > 0 ? item.doneLessons / item.totalLessons : 0;

          return (
            <SwipeableItem 
              key={item.id} 
              onEdit={() => {}} 
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
                      {lang === 'zh-CN' ? `剩余 ${remaining} ${item.unitType === 'session' ? '次' : '课时'}` : `Remaining ${remaining}`}
                      <Feather name="chevron-right" size={14} color="#94A3B8" />
                    </Text>
                  </View>

                  <Text style={styles.memberText}>
                    {member?.name || 'Member'} · {formatSchedule(item.schedule, lang as 'zh-CN' | 'en-US')}
                  </Text>

                  <View style={styles.progressRow}>
                    <Text style={styles.progressText}>
                      <Text style={styles.doneText}>{item.doneLessons}</Text> / {item.totalLessons} {item.unitType === 'session' ? '次' : '课时'}
                    </Text>
                    <View style={styles.costContainer}>
                      <Text style={styles.costText}>
                         {item.totalLessons > 0 ? (item.totalPrice / item.totalLessons).toFixed(1) : '0'} / {item.unitType === 'session' ? '次' : '课时'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${progress * 100}%`, backgroundColor: isUrgent ? '#EF4444' : '#F59E0B' }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </SwipeableItem>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 44, marginTop: 8 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tab: { marginRight: 24, paddingVertical: 12, position: 'relative' },
  tabText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
  activeTabText: { color: COLORS.textPrimary, fontWeight: '600' },
  activeTabIndicator: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, backgroundColor: '#0F172A', borderRadius: 2 },
  listContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 16 },
  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16 },
  cardLeft: { marginRight: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 24 },
  cardMain: { flex: 1 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  className: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  remainingText: { fontSize: 13, fontWeight: '600', color: '#F59E0B' },
  memberText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressText: { fontSize: 13, color: COLORS.textSecondary },
  doneText: { color: COLORS.textPrimary, fontWeight: '600' },
  costContainer: { flexDirection: 'row', alignItems: 'center' },
  costText: { fontSize: 12, color: '#94A3B8' },
  progressBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
});
