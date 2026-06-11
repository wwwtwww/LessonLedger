import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { Member } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../utils/supabase';
import { storage } from '../utils/storage';
import { log } from '../utils/logger';
import { syncQueue } from '../utils/syncQueue';
import { generateUUID } from '../utils/uuid';

export function useMembers() {
  const { lang } = useLanguage();
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMemberId, setCurrentMemberId] = useState<string>('all');
  const pendingChanges = useRef(0);

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

    // 有未完成的写入操作时跳过覆盖
    if (data && pendingChanges.current === 0) {
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
    pendingChanges.current++;
    try {
      const memberId = generateUUID();
      const newMember: Member = { id: memberId, name, icon, themeColor, isDeleted: false };

      setAllMembers(prev => {
        const updated = [...prev, newMember];
        storage.setMembers(updated);
        return updated;
      });

      const { error } = await supabase
        .from('members')
        .insert([{ id: memberId, name, icon, themeColor, isDeleted: false }]);

      if (error) {
        log.warn('useMembers', 'Failed to add member, queuing sync', { message: error.message });
        await syncQueue.add({
          table: 'members',
          type: 'insert',
          payload: { id: memberId, name, icon, themeColor, isDeleted: false },
        });
      }
    } finally {
      pendingChanges.current--;
    }
  }, []);

  const handleUpdateMember = useCallback(async (id: string, data: Partial<Member>) => {
    pendingChanges.current++;
    try {
      const updateData = { ...data };
      delete updateData.id;

      setAllMembers(prev => {
        const updated = prev.map(m => m.id === id ? { ...m, ...data } : m);
        storage.setMembers(updated);
        return updated;
      });

      const { error } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', id);

      if (error) {
        log.warn('useMembers', 'Failed to update member, queuing sync', { message: error.message });
        await syncQueue.add({
          table: 'members',
          type: 'update',
          payload: { id, ...updateData },
        });
      }
    } finally {
      pendingChanges.current--;
    }
  }, []);

  const handleDeleteMember = useCallback(async (id: string) => {
    pendingChanges.current++;
    try {
      setAllMembers(prev => {
        const updated = prev.map(m => m.id === id ? { ...m, isDeleted: true } : m);
        storage.setMembers(updated);
        return updated;
      });

      if (id === currentMemberId) {
        setCurrentMemberId('all');
      }

      const { error } = await supabase
        .from('members')
        .update({ isDeleted: true })
        .eq('id', id);

      if (error) {
        log.warn('useMembers', 'Failed to delete member, queuing sync', { message: error.message });
        await syncQueue.add({
          table: 'members',
          type: 'update',
          payload: { id, isDeleted: true },
        });
      }
    } finally {
      pendingChanges.current--;
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