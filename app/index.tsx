import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// UI Components
import GlassHeader from '../components/ui/GlassHeader';
import AppHeader from '../components/ui/AppHeader';
import SummaryCard from '../components/dashboard/SummaryCard';
import MemberSwitcher from '../components/dashboard/MemberSwitcher';
import AddCourseBtn from '../components/ui/AddCourseBtn';
import ClassCard from '../components/classes/ClassCard';
import LogList from '../components/logs/LogList';
import SwipeableItem from '../components/ui/SwipeableItem';
import EmptyState from '../components/ui/EmptyState';

// Sheets (Modals)
import AddMemberSheet from '../components/sheets/AddMemberSheet';
import AddClassSheet from '../components/sheets/AddClassSheet';

// Hooks & Utils
import { useLanguage } from '../contexts/LanguageContext';
import { useDashboard } from '../hooks/useDashboard';
import { Member, ClassItem, ScheduleEntry } from '../types';
import { requestPermissionsAsync } from '../utils/notifications';
import { COLORS } from '../utils/colors';

// Constants
const HEADER_CONTENT_HEIGHT = 60; // 与 GlassHeader.tsx 中的 content.height 保持一致

export default function DashboardPage() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  // 使用聚合后的 useDashboard Hook
  const {
    members,
    currentMemberId,
    setCurrentMemberId,
    filteredClasses,
    logs,
    stats,
    isLoading,
    themeColor,
    handleAddMember,
    handleUpdateMember,
    handleDeleteMember,
    handleAddClass,
    handleUpdateClass,
    handleDeleteClass,
    handleCheckIn,
    fetchData
  } = useDashboard();

  const [isAddMemberVisible, setIsAddMemberVisible] = useState(false);
  const [isAddClassVisible, setIsAddClassVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // 初始化加载
  useEffect(() => {
    const initApp = async () => {
      await requestPermissionsAsync();
      await fetchData();
    };
    initApp();
  }, [fetchData]);

  // 计算内容滚动的顶部偏移
  const headerOffset = insets.top + HEADER_CONTENT_HEIGHT + 10;

  const onSaveMember = (data: { id?: string; name: string; icon: string; themeColor: string }) => {
    if (data.id) {
      handleUpdateMember(data.id, data);
    } else {
      handleAddMember(data.name, data.icon, data.themeColor);
    }
    setIsAddMemberVisible(false);
    setEditingMember(null);
  };

  const onSaveClass = (data: { id?: string; name: string; memberId: string; totalPrice: number; totalLessons: number; schedule: ScheduleEntry[]; unitType: 'lesson' | 'session' }) => {
    if (data.id) {
      handleUpdateClass(data.id, data);
    } else {
      handleAddClass(data);
    }
    setIsAddClassVisible(false);
    setEditingClass(null);
  };

  const handleMemberLongPress = (member: Member) => {
    if (Platform.OS === 'web') {
      const isEdit = window.confirm(`${t.edit} ${member.name}?`);
      if (isEdit) {
        setEditingMember(member);
        setIsAddMemberVisible(true);
      } else {
        if (window.confirm(t.confirmDeleteMemberMsg.replace('{member}', member.name))) {
          handleDeleteMember(member.id);
        }
      }
      return;
    }

    Alert.alert(member.name, '', [
      { text: t.cancel, style: 'cancel' },
      { text: t.edit, onPress: () => { setEditingMember(member); setIsAddMemberVisible(true); } },
      { text: t.delete, style: 'destructive', onPress: () => handleDeleteMember(member.id) }
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={themeColor || COLORS.primary} />
        <Text style={styles.loadingText}>Syncing with Cloud...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="transparent" 
        translucent 
      />

      <GlassHeader>
        <AppHeader themeColor={themeColor} />
      </GlassHeader>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: headerOffset }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SummaryCard stats={stats} themeColor={themeColor} />

        <MemberSwitcher
          members={members}
          currentId={currentMemberId}
          onSelect={setCurrentMemberId}
          onAddPress={() => setIsAddMemberVisible(true)}
          onLongPress={handleMemberLongPress}
        />

        <AddCourseBtn 
          onPress={() => setIsAddClassVisible(true)} 
          color={themeColor}
        />

        <View style={styles.listSection}>
          {filteredClasses.length === 0 ? (
            <EmptyState title={t.noData} icon="📚" />
          ) : (
            filteredClasses.map(item => (
              <SwipeableItem
                key={item.id}
                onEdit={() => { setEditingClass(item); setIsAddClassVisible(true); }}
                onDelete={() => handleDeleteClass(item.id)}
              >
                <ClassCard
                  classItem={item}
                  owner={item.owner}
                  onCheckIn={handleCheckIn}
                />
              </SwipeableItem>
            ))
          )}
        </View>

        <LogList logs={logs} />
      </ScrollView>

      <AddMemberSheet
        visible={isAddMemberVisible}
        onClose={() => { setIsAddMemberVisible(false); setEditingMember(null); }}
        onAdd={onSaveMember}
        initialData={editingMember}
      />
      <AddClassSheet
        visible={isAddClassVisible}
        onClose={() => { setIsAddClassVisible(false); setEditingClass(null); }}
        onAdd={onSaveClass}
        members={members}
        initialData={editingClass}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    maxWidth: 600,
    width: '100%',
    marginHorizontal: 'auto'
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textLight,
  },
  listSection: {
    marginBottom: 20
  },
});