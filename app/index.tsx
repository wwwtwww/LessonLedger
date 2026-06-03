import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';

// UI Components
import AppHeader from '../components/ui/AppHeader';
import SummaryCard from '../components/ui/SummaryCard';
import MemberTabs from '../components/ui/MemberTabs';
import AddCourseBtn from '../components/ui/AddCourseBtn';
import ClassCard from '../components/ui/ClassCard';
import LogList from '../components/ui/LogList';

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
    handleAddMember
  } = useMembers();

  const {
    filteredClasses,
    logs,
    stats,
    handleCheckIn,
    handleAddClass
  } = useClasses(currentMemberId, members);

  const [isAddMemberVisible, setIsAddMemberVisible] = useState(false);
  const [isAddClassVisible, setIsAddClassVisible] = useState(false);

  const onAddMember = (name: string, icon: string, themeColor: string) => {
    handleAddMember(name, icon, themeColor);
    setIsAddMemberVisible(false);
  };

  const onAddClass = (classItem: { name: string; memberId: string; totalPrice: number; totalLessons: number; schedule: string }) => {
    handleAddClass(classItem);
    setIsAddClassVisible(false);
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
            <ClassCard
              key={item.id}
              classItem={item}
              owner={item.owner}
              onCheckIn={handleCheckIn}
            />
          ))
        )}
      </View>

      <LogList logs={logs} />

      <AddMemberModal
        visible={isAddMemberVisible}
        onClose={() => setIsAddMemberVisible(false)}
        onAdd={onAddMember}
      />
      <AddClassModal
        visible={isAddClassVisible}
        onClose={() => setIsAddClassVisible(false)}
        onAdd={onAddClass}
        members={members}
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
