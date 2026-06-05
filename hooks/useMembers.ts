import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import { Member } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../utils/supabase';

export function useMembers() {
  const { lang } = useLanguage();
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMemberId, setCurrentMemberId] = useState<string>('all');

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .is('isDeleted', false) // 只拉取未删除的
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching members:', error.message);
    }

    if (data) {
      setAllMembers(data);
    }
    setIsLoading(false);
    return data;
  }, []);

  const handleAddMember = useCallback(async (name: string, icon: string, themeColor: string) => {
    const newMember = { name, icon, themeColor, isDeleted: false };
    const { data, error } = await supabase
      .from('members')
      .insert([newMember])
      .select();
    
    if (error) {
      console.error('Error adding member:', error.message, error.details, error.hint);
      if (Platform.OS === 'web') alert(`Failed to add member: ${error.message}`);
      else Alert.alert('Error', `Failed to add member: ${error.message}`);
      return;
    }

    if (data) {
      setAllMembers(prev => [...prev, data[0]]);
    }
  }, []);

  const handleUpdateMember = useCallback(async (id: string, data: Partial<Member>) => {
    const updateData = { ...data };
    delete updateData.id; // 确保不更新主键

    const { error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating member:', error.message);
      if (Platform.OS === 'web') alert(`Failed to update member: ${error.message}`);
      else Alert.alert('Error', `Failed to update member: ${error.message}`);
      return;
    }

    setAllMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  }, []);

  const handleDeleteMember = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('members')
      .update({ isDeleted: true })
      .eq('id', id);
    
    if (!error) {
      setAllMembers(prev => prev.map(m => m.id === id ? { ...m, isDeleted: true } : m));
      if (id === currentMemberId) {
        setCurrentMemberId('all');
      }
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