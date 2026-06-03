import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

// UI Components
import SummaryCard from '../components/ui/SummaryCard';
import MemberTabs from '../components/ui/MemberTabs';
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
  const { lang, setLang, t } = useLanguage();
  const { 
    members, 
    currentMemberId, 
    setCurrentMemberId, 
    handleAddMember 
  } = useMembers();
  
  const { 
    classes, 
    logs, 
    stats, 
    handleCheckIn, 
    handleAddClass 
  } = useClasses();

  const [isAddMemberVisible, setIsAddMemberVisible] = useState(false);
  const [isAddClassVisible, setIsAddClassVisible] = useState(false);

  // Filter logic
  const filteredClasses = useMemo(() => {
    return currentMemberId === 'all' 
      ? classes 
      : classes.filter(c => c.memberId === currentMemberId);
  }, [classes, currentMemberId]);

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
      {/* Language Switcher */}
      <View style={styles.langHeader}>
        <TouchableOpacity style={styles.langBtn} onPress={() => setLang(lang === 'zh-CN' ? 'en-US' : 'zh-CN')}>
          <Text style={styles.langBtnText}>🌐 {t.switchLang}</Text>
        </TouchableOpacity>
      </View>

      {/* Header */}
      <Text style={styles.appTitle}>{t.title}</Text>
      <Text style={styles.appSubTitle}>{t.subTitle}</Text>

      {/* Summary Dashboard */}
      <SummaryCard stats={stats} />

      {/* Member Selection */}
      <MemberTabs 
        members={members}
        currentMemberId={currentMemberId}
        onSelectMember={setCurrentMemberId}
        onAddMemberPress={() => setIsAddMemberVisible(true)}
      />

      {/* Add Course Button */}
      <TouchableOpacity style={styles.addCourseBtn} onPress={() => setIsAddClassVisible(true)}>
        <Text style={styles.addCourseBtnText}>+ {t.addCourse}</Text>
      </TouchableOpacity>

      {/* Class List */}
      <View style={styles.listSection}>
        {filteredClasses.length === 0 ? (
          <Text style={styles.emptyText}>{t.noData}</Text>
        ) : (
          filteredClasses.map(item => {
            const owner = members.find(m => m.id === item.memberId);
            return (
              <ClassCard 
                key={item.id}
                classItem={item}
                owner={owner}
                onCheckIn={handleCheckIn}
              />
            );
          })
        )}
      </View>

      {/* History Logs */}
      <LogList logs={logs} />

      {/* Modals */}
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
  langHeader: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginBottom: 5 
  },
  langBtn: { 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  langBtnText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#475569' 
  },
  appTitle: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#0F172A', 
    textAlign: 'center', 
    marginTop: 5 
  },
  appSubTitle: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#94A3B8', 
    textAlign: 'center', 
    marginBottom: 20, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  addCourseBtn: { 
    backgroundColor: '#0F172A', 
    borderRadius: 12, 
    paddingVertical: 12, 
    alignItems: 'center', 
    marginBottom: 16 
  },
  addCourseBtnText: { 
    color: '#FFFFFF', 
    fontSize: 14, 
    fontWeight: '700' 
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
