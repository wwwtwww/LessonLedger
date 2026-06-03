import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import { ClassItem, LogItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export function useClasses() {
  const { t, lang } = useLanguage();

  const [classes, setClasses] = useState<ClassItem[]>([
    { id: 'c1', memberId: 'm1', name: lang === 'zh-CN' ? '钢琴' : 'Piano', totalPrice: 5000, totalLessons: 22, doneLessons: 10, schedule: '周一晚 18:00', unitType: 'lesson' },
    { id: 'c2', memberId: 'm2', name: lang === 'zh-CN' ? '美术' : 'Art', totalPrice: 2000, totalLessons: 20, doneLessons: 3, schedule: '周三六 14:00', unitType: 'lesson' },
    { id: 'c3', memberId: 'm3', name: lang === 'zh-CN' ? '私教健身' : 'Fitness Gym', totalPrice: 3000, totalLessons: 10, doneLessons: 8, schedule: '周五晚 19:30', unitType: 'session' },
  ]);

  const [logs, setLogs] = useState<LogItem[]>([]);

  const handleAddClass = (classItem: { name: string; memberId: string; totalPrice: number; totalLessons: number; schedule: string }) => {
    setClasses([...classes, {
      ...classItem,
      id: 'c' + Date.now(),
      doneLessons: 0,
      unitType: 'lesson'
    }]);
  };

  const totalSpent = classes.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalClasses = classes.length;
  const totalRemaining = classes.reduce((sum, item) => sum + (item.totalLessons - item.doneLessons), 0);

  const handleCheckIn = (classId: string, className: string, memberName: string) => {
    const performAction = () => {
      setClasses(prevClasses =>
        prevClasses.map(item => {
          if (item.id === classId) {
            if (item.doneLessons >= item.totalLessons) {
              if (Platform.OS === 'web') alert(t.noRemainingError);
              else Alert.alert('', t.noRemainingError);
              return item;
            }

            const now = new Date();
            const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const logMessage = `[${memberName}] ${className} -> -1 ${item.unitType === 'lesson' ? t.unitLesson : t.unitSession}`;

            setLogs(prevLogs => [{ id: Date.now().toString(), time: timeStr, text: logMessage }, ...prevLogs]);
            return { ...item, doneLessons: item.doneLessons + 1 };
          }
          return item;
        })
      );
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
  };

  return { 
    classes, 
    setClasses, 
    logs, 
    stats: { totalSpent, totalClasses, totalRemaining }, 
    handleCheckIn, 
    handleAddClass 
  };
}
