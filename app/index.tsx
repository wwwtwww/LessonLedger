import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { BlurView } from 'expo-blur';

// UI Components
import AppHeader from '../components/ui/AppHeader';
import SummaryCard from '../components/ui/SummaryCard';
import MemberTabs from '../components/ui/MemberTabs';
import AddCourseBtn from '../components/ui/AddCourseBtn';
import ClassCard from '../components/ui/ClassCard';
import LogList from '../components/ui/LogList';
import SwipeableItem from '../components/ui/SwipeableItem';

// Modals
import AddMemberModal from '../components/AddMemberModal';
import AddClassModal from '../components/AddClassModal';

// Hooks & Contexts
import { useLanguage } from '../contexts/LanguageContext';
import { useMembers } from '../hooks/useMembers';
import { useClasses } from '../hooks/useClasses';
import { Member, ClassItem, ScheduleEntry } from '../types';
import { supabase } from '../utils/supabase';
import { requestPermissionsAsync } from '../utils/notifications';

// UI Constants
const HEADER_HEIGHT = 80;
const WEB_PADDING = 20;
const MOBILE_PADDING = 10;
const HEADER_OFFSET = (Platform.OS === 'web' ? WEB_PADDING : MOBILE_PADDING) + HEADER_HEIGHT - 5; // -5px for visual optical compensation

export default function App() {
  const { t } = useLanguage();
  const {
    members,
    currentMemberId,
    setCurrentMemberId,
    handleAddMember,
    handleUpdateMember,
    handleDeleteMember,
    fetchMembers,
    isLoading: isMembersLoading
  } = useMembers();

  const {
    filteredClasses,
    logs,
    stats,
    handleCheckIn,
    handleAddClass,
    handleUpdateClass,
    handleDeleteClass,
    fetchData: fetchClassesAndLogs,
    isLoading: isClassesLoading
  } = useClasses(currentMemberId, members);

  const [isAddMemberVisible, setIsAddMemberVisible] = useState(false);
  const [isAddClassVisible, setIsAddClassVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // 初始化加载云端数据
  useEffect(() => {
    const initApp = async () => {
      await requestPermissionsAsync();

      // 1. 先并行拉取基础数据
      const [fetchedMembers] = await Promise.all([
        fetchMembers(),
        fetchClassesAndLogs()
      ]);
      
      // 如果云端 members 表为空，执行引导流程插入演示数据
      if (fetchedMembers && fetchedMembers.length === 0) {
        console.log('No members found. Inserting default demo data...');
        
        // 2. 插入默认成员
        const { data: mData, error: mError } = await supabase
          .from('members')
          .insert([{ name: '哥哥', icon: '👦', themeColor: '#3B82F6', isDeleted: false }])
          .select();
        
        if (!mError && mData) {
          const newMemberId = mData[0].id;
          // 3. 插入默认课程 (使用 await 确保写入成功)
          await supabase.from('classes').insert([{
            memberId: newMemberId,
            name: '钢琴',
            totalPrice: 5000,
            totalLessons: 22,
            doneLessons: 10,
            schedule: '周一晚 18:00',
            unitType: 'lesson',
            isDeleted: false
          }]);

          // 4. 全部写入成功后，再次拉取以刷新本地所有状态
          await Promise.all([
            fetchMembers(),
            fetchClassesAndLogs()
          ]);
        }
      }
    };

    initApp();
  }, [fetchMembers, fetchClassesAndLogs]);

  const onSaveMember = (data: { id?: string; name: string; icon: string; themeColor: string }) => {
    console.log('app/index.tsx: onSaveMember called with', data);
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

  const handleCloseMemberModal = () => {
    setIsAddMemberVisible(false);
    setEditingMember(null);
  };

  const handleCloseClassModal = () => {
    setIsAddClassVisible(false);
    setEditingClass(null);
  };

  const handleMemberLongPress = (member: Member) => {
    if (Platform.OS === 'web') {
      const isEdit = window.confirm(`${t.edit} ${member.name}? (${t.confirm} -> ${t.edit}, ${t.cancel} -> ${t.delete})`);
      if (isEdit) {
        setEditingMember(member);
        setIsAddMemberVisible(true);
      } else {
        const msg = t.confirmDeleteMemberMsg.replace('{member}', member.name);
        if (window.confirm(msg)) {
          handleDeleteMember(member.id);
        }
      }
      return;
    }

    Alert.alert(
      member.name,
      '',
      [
        { text: t.cancel, style: 'cancel' },
        { 
          text: t.edit, 
          onPress: () => {
            setEditingMember(member);
            setIsAddMemberVisible(true);
          } 
        },
        { 
          text: t.delete, 
          style: 'destructive',
          onPress: () => {
            const msg = t.confirmDeleteMemberMsg.replace('{member}', member.name);
            Alert.alert(t.confirmDeleteMemberTitle, msg, [
              { text: t.cancel, style: 'cancel' },
              { text: t.confirm, style: 'destructive', onPress: () => handleDeleteMember(member.id) }
            ]);
          }
        }
      ]
    );
  };

  if (isMembersLoading || isClassesLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Syncing with Cloud...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" translucent={true} />
      
      {/* 沉浸式毛玻璃头部 - 放在 ScrollView 之上以实现固定悬浮 */}
      <BlurView intensity={80} tint="light" style={styles.headerBlur}>
        <View style={styles.headerContainer}>
          <AppHeader />
        </View>
      </BlurView>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: HEADER_OFFSET }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SummaryCard stats={stats} />

        <MemberTabs
          members={members}
          currentMemberId={currentMemberId}
          onSelectMember={setCurrentMemberId}
          onAddMemberPress={() => {
            console.log('app/index.tsx: Setting isAddMemberVisible to true');
            setIsAddMemberVisible(true);
          }}
          onLongPressMember={handleMemberLongPress}
        />

        <AddCourseBtn onPress={() => setIsAddClassVisible(true)} />

        <View style={styles.listSection}>
          {filteredClasses.length === 0 ? (
            <Text style={styles.emptyText}>{t.noData}</Text>
          ) : (
            filteredClasses.map(item => (
              <SwipeableItem
                key={item.id}
                onEdit={() => {
                  setEditingClass(item);
                  setIsAddClassVisible(true);
                }}
                onDelete={() => {
                  const msg = t.confirmDeleteMsg.replace('{course}', item.name);
                  if (Platform.OS === 'web') {
                    if (window.confirm(msg)) handleDeleteClass(item.id);
                  } else {
                    Alert.alert(t.confirmDeleteTitle, msg, [
                      { text: t.cancel, style: 'cancel' },
                      { text: t.confirm, style: 'destructive', onPress: () => handleDeleteClass(item.id) }
                    ]);
                  }
                }}
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

      {/* Modals */}
      <AddMemberModal
        visible={isAddMemberVisible}
        onClose={handleCloseMemberModal}
        onAdd={onSaveMember}
        initialData={editingMember}
      />
      <AddClassModal
        visible={isAddClassVisible}
        onClose={handleCloseClassModal}
        onAdd={onSaveClass}
        members={members}
        initialData={editingClass}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    // 彻底解决安卓状态栏遮挡的核心逻辑
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    maxWidth: 600,
    width: '100%',
    marginHorizontal: 'auto'
  },
  headerBlur: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerContainer: {
    maxWidth: 600,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 20,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B'
  },
  listSection: {
    marginBottom: 20
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    padding: 20
  },
});