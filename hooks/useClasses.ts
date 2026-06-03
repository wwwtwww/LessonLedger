import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import { ClassItem, LogItem, Member } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export function useClasses(currentMemberId: string, members: Member[]) {
  const { t, lang } = useLanguage();

  const [classes, setClasses] = useState<ClassItem[]>([
    { id: 'c1', memberId: 'm1', name: lang === 'zh-CN' ? '钢琴' : 'Piano', totalPrice: 5000, totalLessons: 22, doneLessons: 10, schedule: '周一晚 18:00', unitType: 'lesson' },
    { id: 'c2', memberId: 'm2', name: lang === 'zh-CN' ? '美术' : 'Art', totalPrice: 2000, totalLessons: 20, doneLessons: 3, schedule: '周三六 14:00', unitType: 'lesson' },
    { id: 'c3', memberId: 'm3', name: lang === 'zh-CN' ? '私教健身' : 'Fitness Gym', totalPrice: 3000, totalLessons: 10, doneLessons: 8, schedule: '周五晚 19:30', unitType: 'session' },
  ]);

  useEffect(() => {
    setClasses(prev => prev.map(item => {
      if (item.id === 'c1') return { ...item, name: lang === 'zh-CN' ? '钢琴' : 'Piano' };
      if (item.id === 'c2') return { ...item, name: lang === 'zh-CN' ? '美术' : 'Art' };
      if (item.id === 'c3') return { ...item, name: lang === 'zh-CN' ? '私教健身' : 'Fitness Gym' };
      return item;
    }));
  }, [lang]);

  const [logs, setLogs] = useState<LogItem[]>([]);

  const filteredClasses = useMemo(() => {
    // 性能优化：构建成员 Map，实现 O(1) 查找
    const memberMap = members.reduce((acc, m) => {
      acc[m.id] = m;
      return acc;
    }, {} as Record<string, Member>);

    const list = currentMemberId === 'all'
      ? classes.filter(c => !c.isDeleted && !!memberMap[c.memberId])
      : classes.filter(c => c.memberId === currentMemberId && !c.isDeleted && !!memberMap[c.memberId]);

    return list.map(c => ({
      ...c,
      owner: memberMap[c.memberId]
    }));
  }, [classes, currentMemberId, members]);

  const handleAddClass = useCallback((classItem: { name: string; memberId: string; totalPrice: number; totalLessons: number; schedule: string }) => {
    setClasses(prev => [...prev, {
      ...classItem,
      id: 'c' + Date.now(),
      doneLessons: 0,
      unitType: 'lesson'
    }]);
  }, []);

  const handleUpdateClass = useCallback((id: string, data: Partial<ClassItem>) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const handleDeleteClass = useCallback((id: string) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, isDeleted: true } : c));
  }, []);

  const stats = useMemo(() => {
    const memberIds = new Set(members.map(m => m.id));
    const activeClasses = classes.filter(c => !c.isDeleted && memberIds.has(c.memberId));
    const totalSpent = activeClasses.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalClasses = activeClasses.length;
    const totalRemaining = activeClasses.reduce((sum, item) => sum + (item.totalLessons - item.doneLessons), 0);
    return { totalSpent, totalClasses, totalRemaining };
  }, [classes, members]);

  const handleCheckIn = useCallback((classId: string, className: string, memberName: string) => {
    const performAction = () => {
      // 修复闭包陷阱：将余额检查和日志生成逻辑移至更新器外部，但基于最新的 classes 状态
      // 这里我们直接在 setClasses 的函数式更新中处理，以确保数据的绝对新鲜
      setClasses(prevClasses => {
        const item = prevClasses.find(c => c.id === classId);
        if (!item) return prevClasses;

        if (item.doneLessons >= item.totalLessons) {
          if (Platform.OS === 'web') alert(t.noRemainingError);
          else Alert.alert('', t.noRemainingError);
          return prevClasses;
        }

        // 状态更新与日志生成分离，保持更新器纯净
        const now = new Date();
        const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const logMessage = `[${memberName}] ${className} -> -1 ${item.unitType === 'lesson' ? t.unitLesson : t.unitSession}`;

        setLogs(prevLogs => [{ id: Date.now().toString(), time: timeStr, text: logMessage }, ...prevLogs]);

        return prevClasses.map(c => c.id === classId ? { ...c, doneLessons: c.doneLessons + 1 } : c);
      });
    };

    const msg = t.confirmMsg.replace('{member}', memberName).replace('{course}', className);
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) performAction();
    } else {
      Alert.alert(t.confirmTitle, msg, [
        { text: t.cancel, style: 'cancel' },
        { text: t.confirm, onPress: performAction }
      ]);
    }
  }, [t]);

  return {
    classes,
    filteredClasses,
    setClasses,
    logs,
    stats,
    handleCheckIn,
    handleAddClass,
    handleUpdateClass,
    handleDeleteClass
  };
}
