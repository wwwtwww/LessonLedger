import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  Platform
} from 'react-native';

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

export default function App() {
  const { t } = useLanguage();
  const {
    members,
    currentMemberId,
    setCurrentMemberId,
    handleAddMember,
    handleUpdateMember
  } = useMembers();

  const {
    filteredClasses,
    logs,
    stats,
    handleCheckIn,
    handleAddClass,
    handleUpdateClass,
    handleDeleteClass
  } = useClasses(currentMemberId, members);

  const [isAddMemberVisible, setIsAddMemberVisible] = useState(false);
  const [isAddClassVisible, setIsAddClassVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editingClass, setEditingClass] = useState<any>(null);

  const onSaveMember = (data: { id?: string; name: string; icon: string; themeColor: string }) => {
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <AppHeader />

      <SummaryCard stats={stats} />

      <MemberTabs
        members={members}
        currentMemberId={currentMemberId}
        onSelectMember={setCurrentMemberId}
        onAddMemberPress={() => setIsAddMemberVisible(true)}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  listSection: {
    marginBottom: 20
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    padding: 20
  },
});
