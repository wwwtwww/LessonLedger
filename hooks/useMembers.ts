import { useState, useEffect, useCallback } from 'react';
import { Member } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export function useMembers() {
  const { lang } = useLanguage();
  
  const [members, setMembers] = useState<Member[]>([
    { id: 'm1', name: lang === 'zh-CN' ? '哥哥' : 'Brother', icon: '👦', themeColor: '#3B82F6' },
    { id: 'm2', name: lang === 'zh-CN' ? '妹妹' : 'Sister', icon: '👧', themeColor: '#EC4899' }, 
    { id: 'm3', name: lang === 'zh-CN' ? '妈妈' : 'Mom', icon: '🏋️', themeColor: '#10B981' },    
  ]);

  useEffect(() => {
    setMembers(prev => prev.map(item => {
      if (item.id === 'm1') return { ...item, name: lang === 'zh-CN' ? '哥哥' : 'Brother' };
      if (item.id === 'm2') return { ...item, name: lang === 'zh-CN' ? '妹妹' : 'Sister' };
      if (item.id === 'm3') return { ...item, name: lang === 'zh-CN' ? '妈妈' : 'Mom' };
      return item;
    }));
  }, [lang]);

  const [currentMemberId, setCurrentMemberId] = useState<string>('all');

  const handleAddMember = useCallback((name: string, icon: string, themeColor: string) => {
    setMembers(prev => [...prev, { id: 'm' + Date.now(), name, icon, themeColor }]);
  }, []);

  return { members, setMembers, currentMemberId, setCurrentMemberId, handleAddMember };
}
