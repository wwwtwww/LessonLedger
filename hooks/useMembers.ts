import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import { Member } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../utils/supabase';
import { storage } from '../utils/storage';
import { log } from '../utils/logger';

export function useMembers() {
  const { lang } = useLanguage();
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMemberId, setCurrentMemberId] = useState<string>('all');

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);

    // Step A: 同步读缓存
    const cached = await storage.getMembers<Member[] | null>();
    if (cached && cached.length > 0) {
      setAllMembers(cached);
      setIsLoading(false);
    }

    // Step B: 后台拉取 Supabase
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .is('isDeleted', false)
      .order('id', { ascending: true });

    if (error) {
      log.error('useMembers', 'Error fetching members', { message: error.message });
      if (!cached) setIsLoading(false);
      return data;
    }

    if (data) {
      setAllMembers(data);
      await storage.setMembers(data);
    }

    setIsLoading(false);
    return data;
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleAddMember = useCallback(async (name: string, icon: string, themeColor: string) => {
    const tempId = `temp_${Date.now()}`;
    const newMember: Member = { id: tempId, name, icon, themeColor, isDeleted: false };

    // 乐观更新：立即更新 UI + 缓存（使用函数式 setState 保证拿到最新值）
    setAllMembers(prev => {
      const updated = [...prev, newMember];
      storage.setMembers(updated);
      return updated;
    });

    // 尝试同步到 Supabase
    const { data, error } = await supabase
      .from('members')
      .insert([{ name, icon, themeColor, isDeleted: false }])
      .select();

    if (error || !data) {
      log.error('useMembers', 'Error adding member', { message: error?.message, details: error?.details, hint: error?.hint });
      if (Platform.OS === 'web') alert(`Failed to add member: ${error?.message}`);
      else Alert.alert('Error', `Failed to add member: ${error?.message}`);
      // 回退乐观更新
      setAllMembers(prev => {
        const reverted = prev.filter(m => m.id !== tempId);
        storage.setMembers(reverted);
        return reverted;
      });
      return;
    }

    // 用云端 ID 替换临时 ID
    setAllMembers(prev => {
      const updated = prev.map(m => m.id === tempId ? { ...m, id: data[0].id } : m);
      storage.setMembers(updated);
      return updated;
    });
  }, []);

  const handleUpdateMember = useCallback(async (id: string, data: Partial<Member>) => {
    const updateData = { ...data };
    delete updateData.id;

    // 乐观更新
    setAllMembers(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...data } : m);
      storage.setMembers(updated);
      return updated;
    });

    // 尝试同步
    const { error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', id);

    if (error) {
      log.error('useMembers', 'Error updating member', { message: error.message, details: error.details, hint: error.hint });
      if (Platform.OS === 'web') alert(`Failed to update member: ${error.message}`);
      else Alert.alert('Error', `Failed to update member: ${error.message}`);
      return;
    }
  }, []);

  const handleDeleteMember = useCallback(async (id: string) => {
    // 乐观更新
    setAllMembers(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, isDeleted: true } : m);
      storage.setMembers(updated);
      return updated;
    });

    if (id === currentMemberId) {
      setCurrentMemberId('all');
    }

    // 尝试同步
    const { error } = await supabase
      .from('members')
      .update({ isDeleted: true })
      .eq('id', id);

    if (error) {
      log.error('useMembers', 'Error deleting member', { message: error.message });
      return;
    }
  }, [currentMemberId]);

  const visibleMembers = useMemo(() => allMembers.filter(m => !m.isDeleted), [allMembers]);

  return { 
    members: visibleMembers, 
    allMembers,
    setMembers: setAllMembers, 
    currentMemberId, 
    setCurrentMemberId, 
    handleAddMember,
    handleUpdateMember,
    handleDeleteMember,
    fetchMembers,
    isLoading
  };
}