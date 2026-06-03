import { useState, useEffect, useCallback, useMemo } from 'react';
import { Member } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export function useMembers() {
  const { lang } = useLanguage();
  
  const [allMembers, setAllMembers] = useState<Member[]>([
    { id: 'm1', name: lang === 'zh-CN' ? '哥哥' : 'Brother', icon: '👦', themeColor: '#3B82F6' },
    { id: 'm2', name: lang === 'zh-CN' ? '妹妹' : 'Sister', icon: '👧', themeColor: '#EC4899' }, 
    { id: 'm3', name: lang === 'zh-CN' ? '妈妈' : 'Mom', icon: '🏋️', themeColor: '#10B981' },    
  ]);

  useEffect(() => {
    setAllMembers(prev => prev.map(item => {
      if (item.id === 'm1') return { ...item, name: lang === 'zh-CN' ? '哥哥' : 'Brother' };
      if (item.id === 'm2') return { ...item, name: lang === 'zh-CN' ? '妹妹' : 'Sister' };
      if (item.id === 'm3') return { ...item, name: lang === 'zh-CN' ? '妈妈' : 'Mom' };
      return item;
    }));
  }, [lang]);

  const [currentMemberId, setCurrentMemberId] = useState<string>('all');

  const visibleMembers = useMemo(() => allMembers.filter(m => !m.isDeleted), [allMembers]);

  const handleAddMember = useCallback((name: string, icon: string, themeColor: string) => {
    setAllMembers(prev => [...prev, { id: 'm' + Date.now(), name, icon, themeColor }]);
  }, []);

  const handleUpdateMember = useCallback((id: string, data: Partial<Member>) => {
    setAllMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  }, []);

  const handleDeleteMember = useCallback((id: string) => {
    setAllMembers(prev => prev.map(m => m.id === id ? { ...m, isDeleted: true } : m));
  }, []);

  return { 
    members: visibleMembers, 
    allMembers,
    setMembers: setAllMembers, 
    currentMemberId, 
    setCurrentMemberId, 
    handleAddMember,
    handleUpdateMember,
    handleDeleteMember
  };
}
