import React, { useState, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GlassHeader, { GLASS_HEADER_HEIGHT } from '../components/ui/GlassHeader';
import AppHeader from '../components/ui/AppHeader';
import FitnessSummaryCards from '../components/dashboard/FitnessSummaryCards';
import TodayClasses from '../components/dashboard/TodayClasses';

import AddMemberSheet from '../components/sheets/AddMemberSheet';
import AddClassSheet from '../components/sheets/AddClassSheet';

import { useLanguage } from '../contexts/LanguageContext';
import { useDashboard } from '../hooks/useDashboard';
import { Member, ClassItem, ScheduleEntry } from '../types';
import { requestPermissionsAsync } from '../utils/notifications';
import { COLORS, SPACING } from '../utils/colors';



export default function DashboardPage() {
  const { t } = useLanguage();

  const {
    members,
    stats,
    isLoading,
    themeColor,
    handleAddMember,
    handleUpdateMember,
    handleAddClass,
    handleUpdateClass,
    handleCheckIn,
    allClasses,
    logs,
  } = useDashboard();

  const [isAddMemberVisible, setIsAddMemberVisible] = useState(false);
  const [isAddClassVisible, setIsAddClassVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
        await requestPermissionsAsync();
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  // Web: GlassHeader is in normal flow, no offset needed
  // Native: GlassHeader is absolute, need to push content below it
  const headerOffset = Platform.OS === 'web' ? 0 : GLASS_HEADER_HEIGHT + 16;

  const onSaveMember = (data: { id?: string; name: string; icon: string; themeColor: string }) => {
    if (data.id) {
      handleUpdateMember(data.id, data);
    } else {
      handleAddMember(data.name, data.icon, data.themeColor);
    }
    setIsAddMemberVisible(false);
    setEditingMember(null);
  };

  const onSaveClass = (data: {
    id?: string; name: string; memberId: string;
    totalPrice: number; totalLessons: number;
    schedule: ScheduleEntry[]; unitType: 'lesson' | 'session';
  }) => {
    if (data.id) {
      handleUpdateClass(data.id, data);
    } else {
      handleAddClass(data);
    }
    setIsAddClassVisible(false);
    setEditingClass(null);
  };

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 周${['日','一','二','三','四','五','六'][today.getDay()]}`;

  if (!appIsReady || (isLoading && members.length === 0)) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <GlassHeader>
        <AppHeader title={t.tabHome} themeColor={themeColor} />
      </GlassHeader>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          headerOffset > 0 ? { paddingTop: headerOffset } : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.dateTitle}>{dateStr}</Text>

        <FitnessSummaryCards stats={stats} themeColor={themeColor} />

        <TodayClasses
          allClasses={allClasses}
          members={members}
          logs={logs}
          onCheckIn={handleCheckIn}
        />
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
        classes={allClasses}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.XL + 16,
    maxWidth: 860,
    width: '100%',
    alignSelf: 'center',
    gap: SPACING.LG,
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  dateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: -8,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
  },
});
