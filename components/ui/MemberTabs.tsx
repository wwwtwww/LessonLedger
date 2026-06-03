import React from 'react';
import { StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { Member } from '../../types';

interface MemberTabsProps {
  members: Member[];
  currentMemberId: string;
  onSelectMember: (id: string) => void;
  onAddMemberPress: () => void;
}

const MemberTabs: React.FC<MemberTabsProps> = ({
  members,
  currentMemberId,
  onSelectMember,
  onAddMemberPress,
}) => {
  const { t } = useLanguage();

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={styles.memberSelectorRow}
    >
      <TouchableOpacity 
        style={[styles.memberTab, currentMemberId === 'all' && styles.memberTabActiveAll]} 
        onPress={() => onSelectMember('all')}
      >
        <Text style={[styles.memberTabText, currentMemberId === 'all' && styles.memberTabTextActive]}>
          {t.allMembers}
        </Text>
      </TouchableOpacity>
      {members.map(m => {
        const isSelected = currentMemberId === m.id;
        return (
          <TouchableOpacity 
            key={m.id} 
            style={[styles.memberTab, isSelected && { backgroundColor: m.themeColor, borderColor: 'transparent' }]} 
            onPress={() => onSelectMember(m.id)}
          >
            <Text style={[styles.memberTabText, isSelected && styles.memberTabTextActive]}>
              {m.icon} {m.name}
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity 
        style={[styles.memberTab, styles.addMemberTab]} 
        onPress={onAddMemberPress}
      >
        <Text style={styles.addMemberTabText}>+ {t.addMember}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  memberSelectorRow: { flexDirection: 'row', marginBottom: 15, paddingBottom: 5 },
  memberTab: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginRight: 8, 
    height: 38 
  },
  memberTabActiveAll: { backgroundColor: '#0F172A', borderColor: 'transparent' },
  memberTabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  memberTabTextActive: { color: '#FFFFFF' },
  addMemberTab: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  addMemberTabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
});

export default MemberTabs;
