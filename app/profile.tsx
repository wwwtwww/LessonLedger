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

        <Text style={styles.sectionTitle}>📝 {t.recentLogs}</Text>
        <LogList logs={logs.slice(0, 5)} classes={allClasses} members={members} />
        <TouchableOpacity style={styles.linkBar} onPress={() => router.push('/logs')}>
          <Text style={styles.linkText}>📋 {t.viewAllLogs} →</Text>
        </TouchableOpacity>

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
  listContainer: { padding: 16, paddingBottom: 40, maxWidth: 430, width: '100%', alignSelf: 'center' },
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
