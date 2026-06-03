import { useState } from 'react';
import { Member } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export function useMembers() {
  const { lang } = useLanguage();
  
  const [members, setMembers] = useState<Member[]>([
    { id: 'm1', name: lang === 'zh-CN' ? '哥哥' : 'Brother', icon: '👦', themeColor: '#3B82F6' },
    { id: 'm2', name: lang === 'zh-CN' ? '妹妹' : 'Sister', icon: '👧', themeColor: '#EC4899' }, 
    { id: 'm3', name: lang === 'zh-CN' ? '妈妈' : 'Mom', icon: '🏋️', themeColor: '#10B981' },    
  ]);
  const [currentMemberId, setCurrentMemberId] = useState<string>('all');

  const handleAddMember = (name: string, icon: string, themeColor: string) => {
    setMembers([...members, { id: 'm' + Date.now(), name, icon, themeColor }]);
  };

  return { members, setMembers, currentMemberId, setCurrentMemberId, handleAddMember };
}
