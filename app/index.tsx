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

// UI Components
import GlassHeader from '../components/ui/GlassHeader';
import AppHeader from '../components/ui/AppHeader';
import SummaryCard from '../components/dashboard/SummaryCard';    
import MemberTabs from '../components/dashboard/MemberTabs';      
import AddCourseBtn from '../components/ui/AddCourseBtn';
import ClassCard from '../components/classes/ClassCard';
import LogList from '../components/logs/LogList';
import SwipeableItem from '../components/ui/SwipeableItem';       

// Modals
import AddMemberSheet from '../components/sheets/AddMemberSheet'; 
import AddClassSheet from '../components/sheets/AddClassSheet';   
// Hooks & Contexts
import { useLanguage } from '../contexts/LanguageContext';
import { useMembers } from '../hooks/useMembers';
import { useClasses } from '../hooks/useClasses';
import { Member, ClassItem, ScheduleEntry } from '../types';
import { supabase } from '../utils/supabase';
import { requestPermissionsAsync } from '../utils/notifications';
import { COLORS } from '../utils/colors';

// UI Constants
const HEADER_CONTENT_HEIGHT = 64; // GlassHeader 内部内容的高度
const WEB_PADDING = 20;
const MOBILE_PADDING = 16;
// HEADER_OFFSET 应该包含状态栏高度 + Header 内容高度 + 间距
const HEADER_OFFSET = (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + HEADER_CONTENT_HEIGHT + MOBILE_PADDING;

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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* 沉浸式毛玻璃头部 */}
      <GlassHeader>
        <AppHeader />
      </GlassHeader>

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
      <AddMemberSheet
        visible={isAddMemberVisible}
        onClose={handleCloseMemberModal}
        onAdd={onSaveMember}
        initialData={editingMember}
      />
      <AddClassSheet
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
    backgroundColor: COLORS.background,
  },
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
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    padding: 20
  },
});