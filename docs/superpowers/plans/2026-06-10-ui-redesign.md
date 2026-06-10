# 全局 UI 重构 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Drawer 导航重构为 Bottom Tab 导航，Dashboard 聚焦「今日课程」一键打卡体验。

**Architecture:** Drawer（4页）→ Bottom Tabs（3个Tab：首页/课程/资料）+ Stack 二级页面。首页展示所有成员今日排期课程，课程页保留列表管理，资料页整合成员管理+日志入口+语言切换。

**Tech Stack:** Expo Router 6 (file-based routing), @react-navigation/bottom-tabs ^7.4.0, React Native, TypeScript

---

### Task 1: 重构导航架构（_layout.tsx）

**Files:**
- Modify: `app/_layout.tsx`
- Remove: `components/ui/CustomDrawerContent.tsx`

Drawer → Bottom Tabs。移除 CustomDrawerContent。

- [ ] **Step 1: 重写 `app/_layout.tsx`**

```tsx
import { Tabs } from 'expo-router';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider, useLanguage } from "../contexts/LanguageContext";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import { useEffect } from 'react';
import { initNetworkListener, useNetwork } from '../hooks/useNetwork';
import { syncQueue, SyncOperation } from '../utils/syncQueue';
import { supabase } from '../utils/supabase';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <BottomSheetModalProvider>
            <TabsWrapper />
          </BottomSheetModalProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function TabsWrapper() {
  const { t } = useLanguage();

  const executeSyncOp = async (op: SyncOperation): Promise<boolean> => {
    try {
      if (op.type === 'insert') {
        const { error } = await supabase.from(op.table).insert([op.payload]).select();
        return !error;
      } else if (op.type === 'update') {
        const { id, ...data } = op.payload;
        const { error } = await supabase.from(op.table).update(data).eq('id', id);
        return !error;
      } else if (op.type === 'delete') {
        const { id } = op.payload;
        const { error } = await supabase.from(op.table).delete().eq('id', id);
        return !error;
      }
      return false;
    } catch {
      return false;
    }
  };

  const { onNetworkChange } = useNetwork();

  useEffect(() => {
    initNetworkListener();

    const unsub = onNetworkChange((isConnected) => {
      if (isConnected) {
        syncQueue.flush(executeSyncOp);
      }
    });

    return unsub;
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: '#E2E8F0',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: t.tabHome,
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          tabBarLabel: t.tabCourses,
          tabBarIcon: ({ color }) => <Feather name="book" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: t.tabProfile,
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: 验证导航能正常切换**

启动应用 `npx expo start`，确认：
- 底部显示3个Tab图标：首页/课程/资料
- 点击切换正常
- 不会出现白屏/报错

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: replace Drawer with BottomTab navigation"
```

---

### Task 2: 新增国际化文案

**Files:**
- Modify: `contexts/LanguageContext.tsx`

在 `i18n['zh-CN']` 和 `i18n['en-US']` 字典中添加新 key。

- [ ] **Step 1: 在 `contexts/LanguageContext.tsx` 添加新文案**

在 `'zh-CN'` 对象内（第88行 `remainingClasses` 后）添加：
```tsx
    tabHome: '首页',
    tabCourses: '课程',
    tabProfile: '资料',
    todayClasses: '今日课程',
    upcomingClasses: '近期课程',
    noClassToday: '今天没有排课',
    checkedIn: '已打卡',
    viewAllCourses: '查看全部课程',
    addFirstClass: '添加第一门课程',
    recentLogs: '最近打卡',
    viewAllLogs: '查看全部打卡日志',
    addFirstMember: '添加第一个家庭成员',
```

在 `'en-US'` 对象内（第172行 `remainingClasses` 后）添加：
```tsx
    tabHome: 'Home',
    tabCourses: 'Courses',
    tabProfile: 'Profile',
    todayClasses: "Today's Classes",
    upcomingClasses: 'Upcoming Classes',
    noClassToday: 'No classes today',
    checkedIn: 'Checked In',
    viewAllCourses: 'View All Courses',
    addFirstClass: 'Add Your First Class',
    recentLogs: 'Recent Logs',
    viewAllLogs: 'View All Logs',
    addFirstMember: 'Add First Member',
```

- [ ] **Step 2: Commit**

```bash
git add contexts/LanguageContext.tsx
git commit -m "feat: add new i18n keys for tab navigation and dashboard"
```

---

### Task 3: 创建 ClassCheckInCard 组件

**Files:**
- Create: `components/dashboard/ClassCheckInCard.tsx`

单门课程打卡卡片，支持三种状态：正常（紫）、预警红（≤3）、已打卡（灰）。

- [ ] **Step 1: 创建 `components/dashboard/ClassCheckInCard.tsx`**

```tsx
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
    paddingVertical: 14,
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
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/ClassCheckInCard.tsx
git commit -m "feat: add ClassCheckInCard component with three states"
```

---

### Task 4: 创建 TodayClasses 组件

**Files:**
- Create: `components/dashboard/TodayClasses.tsx`

今日课程列表，处理正常/空/全部打卡三种状态。空状态降级为未来7天课程。

- [ ] **Step 1: 创建 `components/dashboard/TodayClasses.tsx`**

```tsx
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

/** 判断课程是否今日已打卡 */
function isCheckedInToday(classId: string, logs: LogItem[]): boolean {
  const today = new Date().toLocaleDateString();
  return logs.some(log => {
    const logDate = new Date(log.time).toLocaleDateString();
    return logDate === today && (log.classId === classId || log.text.includes(classId));
  });
}

/** 匹配今日排期课程 */
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

/** 获取未来7天排期课程（空状态降级） */
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

  // 无成员：引导添加
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

  // 无课程：引导添加
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

  // 有今日课程
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

  // 今日无课：降级为近期课程
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

  // 完全无排期课程：显示活跃课程
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
  container: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  hintText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  dateGroupLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  linkBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginTop: 6,
  },
  linkText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/TodayClasses.tsx
git commit -m "feat: add TodayClasses component with fallback states"
```

---

### Task 5: 重构 Dashboard 页面（index.tsx）

**Files:**
- Modify: `app/index.tsx`

替换 Dashboard 内容：移除 WarningSection、MemberSwitcher、LogList，加入 TodayClasses。

- [ ] **Step 1: 重写 `app/index.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GlassHeader from '../components/ui/GlassHeader';
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

const HEADER_CONTENT_HEIGHT = 72;

export default function DashboardPage() {
  const insets = useSafeAreaInsets();
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

  const onSaveClass = async (data: {
    id?: string; name: string; memberId: string;
    totalPrice: number; totalLessons: number;
    schedule: ScheduleEntry[]; unitType: 'lesson' | 'session';
  }) => {
    if (data.id) {
      await handleUpdateClass(data.id, data);
    } else {
      await handleAddClass(data);
    }
    setIsAddClassVisible(false);
    setEditingClass(null);
  };

  // 获取今日日期字符串
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <GlassHeader>
        <AppHeader title={t.tabHome} themeColor={themeColor} />
      </GlassHeader>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: headerOffset },
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
    paddingBottom: SPACING.XL + 16,
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
    gap: SPACING.LG,
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
```

- [ ] **Step 2: Commit**

```bash
git add app/index.tsx
git commit -m "refactor: redesign Dashboard with TodayClasses as core area"
```

---

### Task 6: 移除 ClassCard 打卡按钮

**Files:**
- Modify: `components/classes/ClassCard.tsx`

打卡已移至首页，ClassCard 仅用于课程列表查看。移除 check-in 按钮及相关逻辑。

- [ ] **Step 1: 修改 `components/classes/ClassCard.tsx`**

将第 80-88 行的打卡按钮替换为显示剩余信息，同时简化接口移除 `onCheckIn` prop。

新接口：
```tsx
interface ClassCardProps {
  classItem: ClassItem;
  owner?: Member;
}
```

将整个文件末尾的 `checkInBtn` 样式替换为简单剩余标签（只显示已完成/剩余状态，不满屏按钮）：

组件 return 部分（第41-89行）替换为：
```tsx
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
    </View>
  );
```

- [ ] **Step 2: Commit**

```bash
git add components/classes/ClassCard.tsx
git commit -m "refactor: remove check-in button from ClassCard"
```

---

### Task 7: 更新 AppHeader（移除 Drawer 菜单）

**Files:**
- Modify: `components/ui/AppHeader.tsx`

移除 Drawer 菜单按钮逻辑，简化为纯标题组件。

- [ ] **Step 1: 修改 `components/ui/AppHeader.tsx`**

移除 `useNavigation`、`DrawerActions` 导入，移除左侧菜单按钮，改为仅显示返回按钮或空白占位：

```tsx
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../utils/colors';
import { triggerHaptic } from '../../utils/haptics';

interface AppHeaderProps {
  title?: string;
  themeColor?: string;
  onNotificationPress?: () => void;
  hasNotification?: boolean;
  rightComponent?: React.ReactNode;
  showBack?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title = "LessonLedger",
  themeColor,
  onNotificationPress,
  hasNotification = false,
  rightComponent,
  showBack = false,
}) => {
  const router = useRouter();

  const handleBackPress = () => {
    triggerHaptic('light');
    router.back();
  };

  return (
    <View style={styles.topBar}>
      <View style={styles.iconBtn}>
        {showBack ? (
          <TouchableOpacity onPress={handleBackPress}>
            <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={[styles.appTitle, themeColor ? { color: themeColor } : null]} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightContainer}>
        {rightComponent ? (
          rightComponent
        ) : (
          onNotificationPress && (
            <TouchableOpacity onPress={onNotificationPress} style={styles.iconBtn}>
              <View>
                <Feather name="bell" size={24} color={COLORS.textPrimary} />
                {hasNotification && <View style={styles.redDot} />}
              </View>
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  rightContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redDot: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});

export default AppHeader;
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/AppHeader.tsx
git commit -m "refactor: remove Drawer menu from AppHeader"
```

---

### Task 8: 创建 Profile 资料页

**Files:**
- Create: `app/profile.tsx`

Tab3 资料页：成员列表 + 最近日志 + 语言切换。

- [ ] **Step 1: 创建 `app/profile.tsx`**

```tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, StatusBar, Alert, Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../utils/colors';
import { useDashboard } from '../hooks/useDashboard';
import { useLanguage } from '../contexts/LanguageContext';
import AppHeader from '../components/ui/AppHeader';
import AddMemberSheet from '../components/sheets/AddMemberSheet';
import SwipeableItem from '../components/ui/SwipeableItem';
import LogList from '../components/logs/LogList';
import { Member } from '../types';

export default function ProfileScreen() {
  const { t, toggleLang, lang } = useLanguage();
  const {
    members, allClasses, logs,
    handleDeleteMember, handleAddMember, handleUpdateMember
  } = useDashboard();
  const router = useRouter();

  const [isAddMemberVisible, setIsAddMemberVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const onSaveMember = (data: { id?: string; name: string; icon: string; themeColor: string }) => {
    if (data.id) {
      handleUpdateMember(data.id, data);
    } else {
      handleAddMember(data.name, data.icon, data.themeColor);
    }
    setIsAddMemberVisible(false);
    setEditingMember(null);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setIsAddMemberVisible(true);
  };

  const confirmDelete = (member: Member) => {
    if (Platform.OS === 'web') {
      if (window.confirm(t.confirmDeleteMemberMsg?.replace('{member}', member.name) || `Delete ${member.name}?`)) {
        handleDeleteMember(member.id);
      }
    } else {
      Alert.alert(
        member.name,
        t.confirmDeleteMemberMsg?.replace('{member}', member.name) || `Delete ${member.name}?`,
        [
          { text: t.cancel || 'Cancel', style: 'cancel' },
          { text: t.delete || 'Delete', style: 'destructive', onPress: () => handleDeleteMember(member.id) }
        ]
      );
    }
  };

  const headerRight = (
    <TouchableOpacity onPress={() => { setEditingMember(null); setIsAddMemberVisible(true); }}>
      <Feather name="plus" size={24} color={COLORS.textPrimary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.headerWrapper}>
        <AppHeader title={t.tabProfile} rightComponent={headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {/* 成员列表 */}
        <Text style={styles.sectionTitle}>👥 {t.members}</Text>
        {members.map(member => (
          <SwipeableItem
            key={member.id}
            onEdit={() => handleEdit(member)}
            onDelete={() => confirmDelete(member)}
          >
            <View style={styles.memberCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>{member.icon}</Text>
              </View>
              <Text style={styles.memberName}>{member.name}</Text>
              <View style={[styles.colorIndicator, { backgroundColor: member.themeColor }]} />
            </View>
          </SwipeableItem>
        ))}

        {/* 最近打卡日志 */}
        <Text style={styles.sectionTitle}>📝 {t.recentLogs}</Text>
        <LogList logs={logs.slice(0, 5)} classes={allClasses} members={members} />
        <TouchableOpacity style={styles.linkBar} onPress={() => router.push('/logs')}>
          <Text style={styles.linkText}>📋 {t.viewAllLogs} →</Text>
        </TouchableOpacity>

        {/* 语言切换 */}
        <View style={styles.langSwitch}>
          <Text style={styles.langLabel}>🌐 {lang === 'zh-CN' ? '中文' : 'English'}</Text>
          <TouchableOpacity style={styles.langBtn} onPress={toggleLang}>
            <Text style={styles.langBtnText}>{t.switchLang}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AddMemberSheet
        visible={isAddMemberVisible}
        onClose={() => { setIsAddMemberVisible(false); setEditingMember(null); }}
        onAdd={onSaveMember}
        initialData={editingMember}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerWrapper: { height: 56, paddingHorizontal: 4 },
  listContainer: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
    marginTop: 8,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: { fontSize: 20 },
  memberName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  colorIndicator: { width: 12, height: 12, borderRadius: 6 },
  linkBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginTop: 8,
    marginBottom: 20,
  },
  linkText: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  langSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  langLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  langBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  langBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/profile.tsx
git commit -m "feat: add Profile tab page with members, logs, and language switch"
```

---

### Task 9: 清理无用文件和修复引用

**Files:**
- Remove: `app/members.tsx`
- Modify: `app/courses.tsx` — 移除 showBack
- Modify: `app/logs.tsx` — 无需修改（showBack 保留）

- [ ] **Step 1: 更新 `app/courses.tsx` 移除 showBack**

将 courses.tsx 第61行的 `showBack` 移除：
```tsx
// 修改前
<AppHeader title={t.courses} rightComponent={headerRight} showBack />
// 修改后
<AppHeader title={t.courses} rightComponent={headerRight} />
```

- [ ] **Step 2: 删除 `app/members.tsx`**

```bash
Remove-Item -LiteralPath "app/members.tsx"
```

- [ ] **Step 3: 删除未使用的组件文件**

```bash
Remove-Item -LiteralPath "components/ui/CustomDrawerContent.tsx"
Remove-Item -LiteralPath "components/dashboard/WarningSection.tsx"
Remove-Item -LiteralPath "components/dashboard/MemberSwitcher.tsx"
Remove-Item -LiteralPath "components/dashboard/SummaryCard.tsx"
Remove-Item -LiteralPath "components/dashboard/MemberTabs.tsx"
```

- [ ] **Step 4: 检查 `hooks/useDashboard.ts` 导出**

确保 `useDashboard` 导出 `allClasses` 和 `logs`（当前已经导出 `allClasses: classHook.classes`，日志也在导出中）。检查无误即可。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove deprecated pages and components"
```

---

### Task 10: 验证和修复

**Files:** 无新建，验证所有页面是否正常工作。

- [ ] **Step 1: 启动项目**

```bash
cd E:\LessonLedger && npx expo start
```

- [ ] **Step 2: 逐Tab验证**

- Tab 首页：确认显示日期、汇总卡片、今日课程（或空状态）
- 点击课程卡片「打卡」按钮：确认弹出确认框 → 打卡成功 → 卡片变灰
- 无今日课程时：确认降级为近期课程
- Tab 课程：确认课程列表正常，侧滑编辑/删除正常
- Tab 资料：确认成员列表正常，最近日志显示正常，语言切换正常
- 点击「查看全部打卡日志」：确认跳转到 /logs 页面
- /logs 页面：确认日志列表正常，详情弹窗正常

- [ ] **Step 3: 验证打卡流程**

1. 首页 → 点击「打卡」→ 确认弹窗 → 确认
2. 卡片变为灰色 + 已打卡
3. 切换到 Tab3 资料页 → 最近日志中出现该打卡记录

- [ ] **Step 4: Commit 任何修复**

如有问题修复后：

```bash
git add -A && git commit -m "fix: verify and fix issues after refactoring"
```
