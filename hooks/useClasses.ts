import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import { ClassItem, LogItem, Member } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../utils/supabase';
import { scheduleClassReminders, cancelReminders } from '../utils/notifications';

export function useClasses(currentMemberId: string, members: Member[]) {
  const { t } = useLanguage();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [classesRes, logsRes] = await Promise.all([
      supabase.from('classes').select('*').is('isDeleted', false).order('id', { ascending: true }),
      supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(20)
    ]);

    if (!classesRes.error && classesRes.data) {
      const formattedClasses = classesRes.data.map((c: any) => ({
        ...c,
        notificationIds: c.notificationids !== undefined ? c.notificationids : c.notificationIds
      }));
      setClasses(formattedClasses);
    }
    if (!logsRes.error && logsRes.data) {
      // 转换 Supabase 的 created_at 为我们需要的 time 格式
      const formattedLogs = logsRes.data.map((log: any) => ({
        id: log.id.toString(),
        time: new Date(log.created_at).toLocaleString(),
        text: log.text
      }));
      setLogs(formattedLogs);
    }
    setIsLoading(false);
  }, []);

  const filteredClasses = useMemo(() => {
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

  const handleAddClass = useCallback(async (classItem: Omit<ClassItem, 'id' | 'doneLessons' | 'isDeleted' | 'owner' | 'notificationIds'>) => {
    console.log('Adding class:', classItem);
    const newClass = { ...classItem, doneLessons: 0, isDeleted: false };
    const { data, error } = await supabase
      .from('classes')
      .insert([newClass])
      .select();
    
    if (error) {
      console.error('Error adding class:', error.message);
      if (Platform.OS === 'web') alert(`Failed to add course: ${error.message}`);
      else Alert.alert('Error', `Failed to add course: ${error.message}`);
      return;
    }

    if (data) {
      console.log('Class added successfully:', data[0]);
      const memberName = members.find(m => m.id === classItem.memberId)?.name || '未知';
      const ids = await scheduleClassReminders(data[0] as ClassItem, memberName);
      
      if (ids.length > 0) {
        await supabase.from('classes').update({ notificationids: ids }).eq('id', data[0].id);
      }
      
      setClasses(prev => [...prev, { ...data[0], notificationIds: ids }]);
    }
  }, [members]);

  const handleUpdateClass = useCallback(async (id: string, data: Partial<ClassItem>) => {
    console.log('Updating class:', id, data);
    const oldClass = classes.find(c => c.id === id);
    await cancelReminders(oldClass?.notificationIds);

    const memberName = members.find(m => m.id === (data.memberId || oldClass?.memberId))?.name || '未知';
    const updatedClass = { ...oldClass, ...data } as ClassItem;
    const ids = await scheduleClassReminders(updatedClass, memberName);

    const updateData = { ...data, notificationIds: ids };
    delete (updateData as any).id;
    delete (updateData as any).owner; // 确保不包含关联对象

    const { error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating class:', error.message);
      if (Platform.OS === 'web') alert(`Failed to update course: ${error.message}`);
      else Alert.alert('Error', `Failed to update course: ${error.message}`);
      return;
    }

    setClasses(prev => prev.map(c => c.id === id ? { ...c, ...data, notificationIds: ids } : c));
  }, [classes, members]);

  const handleDeleteClass = useCallback(async (id: string) => {
    console.log('Deleting class:', id);
    const oldClass = classes.find(c => c.id === id);
    await cancelReminders(oldClass?.notificationIds);

    const { error } = await supabase
      .from('classes')
      .update({ isDeleted: true })
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting class:', error.message);
      Alert.alert('Error', `Failed to delete course: ${error.message}`);
      return;
    }

    setClasses(prev => prev.map(c => c.id === id ? { ...c, isDeleted: true } : c));
  }, [classes]);

  const stats = useMemo(() => {
    const memberIds = new Set(members.map(m => m.id));
    const activeClasses = classes.filter(c => !c.isDeleted && memberIds.has(c.memberId));
    const totalSpent = activeClasses.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalClasses = activeClasses.length;
    const totalRemaining = activeClasses.reduce((sum, item) => sum + (item.totalLessons - item.doneLessons), 0);
    return { totalSpent, totalClasses, totalRemaining };
  }, [classes, members]);

  const handleCheckIn = useCallback((classId: string, className: string, memberName: string) => {
    const performAction = async () => {
      const item = classes.find(c => c.id === classId);
      if (!item || item.isDeleted) return;

      if (item.doneLessons >= item.totalLessons) {
        const errorMsg = t.noRemainingError;
        if (Platform.OS === 'web') alert(errorMsg);
        else Alert.alert('', errorMsg);
        return;
      }

      await cancelReminders(item.notificationIds);

      const nextDoneLessons = item.doneLessons + 1;
      const logMessage = `[${memberName}] ${className} -> -1 ${item.unitType === 'lesson' ? t.unitLesson : t.unitSession}`;

      const updatedClass = { ...item, doneLessons: nextDoneLessons };
      const ids = await scheduleClassReminders(updatedClass, memberName);

      // 1. 更新云端课程表
      const { error: updateError } = await supabase
        .from('classes')
        .update({ doneLessons: nextDoneLessons, notificationIds: ids })
        .eq('id', classId);

      if (updateError) {
        console.error('Update check-in failed:', updateError);
        return;
      }

      // 2. 插入云端日志表
      const { data: logData, error: logError } = await supabase
        .from('logs')
        .insert([{ text: logMessage, class_id: classId }])
        .select();

      if (logError) {
        console.error('Insert log failed:', logError);
        const errorMsg = `Check-in succeeded but log was not saved: ${logError.message}`;
        if (Platform.OS === 'web') alert(errorMsg);
        else Alert.alert('Warning', errorMsg);
      }

      // 3. 更新本地状态
      setClasses(prev => prev.map(c => c.id === classId ? { ...c, doneLessons: nextDoneLessons, notificationIds: ids } : c));
      
      if (logData) {
        const newLog: LogItem = {
          id: logData[0].id.toString(),
          time: new Date(logData[0].created_at).toLocaleString(),
          text: logMessage
        };
        setLogs(prev => [newLog, ...prev]);
      }
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
  }, [classes, t]);

  return {
    classes,
    filteredClasses,
    logs,
    stats,
    handleCheckIn,
    handleAddClass,
    handleUpdateClass,
    handleDeleteClass,
    fetchData,
    isLoading
  };
}
