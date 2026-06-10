import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { triggerHaptic } from '../utils/haptics';

// UI Components
import GlassHeader from '../components/ui/GlassHeader';
import AppHeader from '../components/ui/AppHeader';
import FitnessSummaryCards from '../components/dashboard/FitnessSummaryCards';
import MemberSwitcher from '../components/dashboard/MemberSwitcher';
import WarningSection from '../components/dashboard/WarningSection';
import LogList from '../components/logs/LogList';

// Sheets (Modals)
import AddMemberSheet from '../components/sheets/AddMemberSheet';
import AddClassSheet from '../components/sheets/AddClassSheet';

// Hooks & Utils
import { useLanguage } from '../contexts/LanguageContext';
import { useDashboard } from '../hooks/useDashboard';
import { Member, ClassItem, ScheduleEntry } from '../types';
import { requestPermissionsAsync } from '../utils/notifications';
import { COLORS, SPACING } from '../utils/colors';

// Constants
const HEADER_CONTENT_HEIGHT = 72; // 与 GlassHeader.tsx 中的 content.height 保持一致

export default function DashboardPage() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const router = useRouter();

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
    handleCheckIn,
    fetchData,
    fetchMembers,
    allClasses
  } = useDashboard();

  const [isAddMemberVisible, setIsAddMemberVisible] = useState(false);
  const [isAddClassVisible, setIsAddClassVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // 初始化加载
  useEffect(() => {
    const initApp = async () => {
      await requestPermissionsAsync();
      await Promise.all([
        fetchMembers(),
        fetchData()
      ]);
    };
    initApp();
  }, [fetchData, fetchMembers]);

  // 计算内容滚动的顶部偏移
  const headerOffset = insets.top + HEADER_CONTENT_HEIGHT + 24;

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
    router.push('/members');
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
        <AppHeader 
          title={t.dashboard}
          themeColor={themeColor} 
          onNotificationPress={() => router.push('/logs')}
        />
      </GlassHeader>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: headerOffset }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <FitnessSummaryCards stats={stats} themeColor={themeColor} />

        <MemberSwitcher
          members={members}
          currentId={currentMemberId}
          onSelect={setCurrentMemberId}
          onAddPress={() => setIsAddClassVisible(true)} // Image mockup shows '+' to add course
          onLongPress={handleMemberLongPress}
        />

        <WarningSection 
          classes={filteredClasses} 
          members={members}
          themeColor={themeColor} 
          onCheckIn={(classId) => {
            const cls = filteredClasses.find(c => c.id === classId);
            if (cls) {
              const m = members.find(mem => mem.id === cls.memberId);
              handleCheckIn(classId, cls.name, m?.name || '未知');
            }
          }}
        />

        <TouchableOpacity onPress={() => router.push('/logs')} activeOpacity={0.7}>
          <LogList 
            logs={logs} 
            classes={allClasses}
            members={members}
          />
        </TouchableOpacity>
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
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XL + SPACING.MD, // 48px
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
    gap: SPACING.LG,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
  },
});
