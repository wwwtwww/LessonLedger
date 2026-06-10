import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import { useDashboard } from '../hooks/useDashboard';
import { useLanguage } from '../contexts/LanguageContext';
import AddMemberSheet from '../components/sheets/AddMemberSheet';
import SwipeableItem from '../components/ui/SwipeableItem';
import AppHeader from '../components/ui/AppHeader';
import { Member } from '../types';

const THEME_COLORS = ['#6366F1', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#D946EF', '#F43F5E'];

export default function MembersScreen() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const { members, handleDeleteMember, handleAddMember, handleUpdateMember } = useDashboard();

  const [isAddVisible, setIsAddVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const onSaveMember = (data: { id?: string; name: string; icon: string; themeColor: string }) => {
    if (data.id) {
      handleUpdateMember(data.id, data);
    } else {
      handleAddMember(data.name, data.icon, data.themeColor);
    }
    setIsAddVisible(false);
    setEditingMember(null);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setIsAddVisible(true);
  };

  const confirmDelete = (member: Member) => {
    if (Platform.OS === 'web') {
      if (window.confirm(t.confirmDeleteMemberMsg?.replace('{member}', member.name) || `Delete ${member.name}?`)) {
        handleDeleteMember(member.id);
      }
    } else {
      Alert.alert(member.name, t.confirmDeleteMemberMsg?.replace('{member}', member.name) || `Delete ${member.name}?`, [
        { text: t.cancel || 'Cancel', style: 'cancel' },
        { text: t.delete || 'Delete', style: 'destructive', onPress: () => handleDeleteMember(member.id) }
      ]);
    }
  };

  const headerRight = (
    <TouchableOpacity onPress={() => { setEditingMember(null); setIsAddVisible(true); }} style={styles.iconBtn}>
      <Feather name="plus" size={24} color={COLORS.textPrimary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.headerWrapper}>
        <AppHeader title={t.members} rightComponent={headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {members.map((member, index) => (
          <SwipeableItem 
            key={member.id}
            onEdit={() => handleEdit(member)}
            onDelete={() => confirmDelete(member)}
          >
            <View style={styles.memberCard}>
              <View style={styles.leftContent}>
                <View style={[styles.avatar, { backgroundColor: `${member.themeColor}15` }]}>
                  <Text style={styles.avatarEmoji}>{member.icon}</Text>
                </View>
                <Text style={styles.memberName}>{member.name}</Text>
                {index === 0 && (
                  <View style={styles.defaultTag}>
                    <Text style={styles.defaultTagText}>{lang === 'zh-CN' ? '默认成员' : 'Default'}</Text>
                  </View>
                )}
              </View>

              <View style={styles.rightContent}>
                <View style={styles.colorPalette}>
                  {THEME_COLORS.slice(0, 5).map(c => (
                    <View key={c} style={[styles.colorDot, { backgroundColor: c }, member.themeColor === c && styles.colorDotActive]} />
                  ))}
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.textSecondary} style={{ marginLeft: 8 }} />
              </View>
            </View>
          </SwipeableItem>
        ))}
      </ScrollView>

      <AddMemberSheet
        visible={isAddVisible}
        onClose={() => { setIsAddVisible(false); setEditingMember(null); }}
        onAdd={onSaveMember}
        initialData={editingMember}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerWrapper: { height: 56, paddingHorizontal: 4 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, gap: 12 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leftContent: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarEmoji: { fontSize: 24 },
  memberName: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginRight: 8 },
  defaultTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  defaultTagText: { fontSize: 12, color: COLORS.textSecondary },
  rightContent: { flexDirection: 'row', alignItems: 'center' },
  colorPalette: { flexDirection: 'row', gap: 4 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  colorDotActive: { borderWidth: 2, borderColor: '#000' }
});