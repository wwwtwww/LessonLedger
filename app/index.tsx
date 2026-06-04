import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
import { Member, ClassItem } from '../types';
import { supabase } from '../utils/supabase';

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
      const fetchedMembers = await fetchMembers();
      
      // 如果云端 members 表为空，插入演示数据
      if (fetchedMembers && fetchedMembers.length === 0) {
        console.log('No members found. Inserting default demo data...');
        
        // 1. 插入默认成员
        const { data: mData, error: mError } = await supabase
          .from('members')
          .insert([{ name: '哥哥', icon: '👦', themeColor: '#3B82F6', isDeleted: false }])
          .select();
        
        if (!mError && mData) {
          // 重新拉取一次成员以获取 ID
          const updatedMembers = await fetchMembers();
          
          if (updatedMembers && updatedMembers.length > 0) {
            const newMemberId = updatedMembers[0].id;
            // 2. 插入默认课程
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
          }
        }
      }
      
      // 拉取课程和日志
      fetchClassesAndLogs();
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

  const onSaveClass = (data: { id?: string; name: string; memberId: string; totalPrice: number; totalLessons: number; schedule: string; unitType: 'lesson' | 'session' }) => {
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
      <SafeAreaView style={[styles.safeArea, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Syncing with Cloud...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader />

      <SummaryCard stats={stats} />

      <MemberTabs
        members={members}
        currentMemberId={currentMemberId}
        onSelectMember={setCurrentMemberId}
        onAddMemberPress={() => setIsAddMemberVisible(true)}
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
    backgroundColor: '#F8FAFC'
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  contentContainer: {
    padding: 20,
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