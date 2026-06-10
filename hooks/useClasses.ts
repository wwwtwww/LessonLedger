import { useState, useCallback, useMemo, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { ClassItem, LogItem, Member } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../utils/supabase';
import { storage } from '../utils/storage';
import { scheduleClassReminders, cancelReminders } from '../utils/notifications';
import { syncQueue } from '../utils/syncQueue';

export function useClasses(currentMemberId: string, members: Member[]) {
  const { t } = useLanguage();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    // Step A: 同步读缓存
    const [cachedClasses, cachedLogs] = await Promise.all([
      storage.getClasses<ClassItem[] | null>(),
      storage.getLogs<LogItem[] | null>(),
    ]);
    if (cachedClasses && cachedClasses.length > 0) {
      setClasses(cachedClasses);
      setIsLoading(false);
    }
    if (cachedLogs && cachedLogs.length > 0) {
      setLogs(cachedLogs);
    }

    // Step B: 后台拉取 Supabase
    const [classesRes, logsRes] = await Promise.all([
      supabase.from('classes').select('*').is('isDeleted', false).order('id', { ascending: true }),
      supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(20),
    ]);

    if (!classesRes.error && classesRes.data) {
      const formattedClasses = classesRes.data.map((c: any) => ({
        ...c,
        notificationIds: c.notificationids !== undefined ? c.notificationids : c.notificationIds,
      })) as ClassItem[];
      setClasses(formattedClasses);
      await storage.setClasses(formattedClasses);
    } else if (!cachedClasses) {
      setIsLoading(false);
    }

    if (!logsRes.error && logsRes.data) {
      const formattedLogs = logsRes.data.map((log: any) => ({
        id: log.id.toString(),
        time: new Date(log.created_at).toLocaleString(),
        text: log.text,
        classId: log.class_id?.toString(),
      })) as LogItem[];
      setLogs(formattedLogs);
      await storage.setLogs(formattedLogs);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    const tempId = `temp_${Date.now()}`;
    const newClass: ClassItem = { ...classItem, id: tempId, doneLessons: 0, isDeleted: false, notificationIds: [] };

    // 乐观更新
    setClasses(prev => {
      const updated = [...prev, newClass];
      storage.setClasses(updated);
      return updated;
    });

    // 尝试同步
    const newClassPayload = { ...classItem, doneLessons: 0, isDeleted: false };
    const { data, error } = await supabase
      .from('classes')
      .insert([newClassPayload])
      .select();

    if (error || !data) {
      console.error('Error adding class (will retry):', error?.message);
      await syncQueue.add({
        table: 'classes',
        type: 'insert',
        payload: newClassPayload,
        tempId,
      });
      return;
    }

    const memberName = members.find(m => m.id === classItem.memberId)?.name || '未知';
    const ids = await scheduleClassReminders(data[0] as ClassItem, memberName);
    if (ids.length > 0) {
      await supabase.from('classes').update({ notificationids: ids }).eq('id', data[0].id);
    }

    setClasses(prev => {
      const updated = prev.map(c => c.id === tempId ? { ...data[0], notificationIds: ids } : c);
      storage.setClasses(updated);
      return updated;
    });
  }, [members]);

  const handleUpdateClass = useCallback(async (id: string, data: Partial<ClassItem>) => {
    console.log('Updating class:', id, data);
    const oldClass = classes.find(c => c.id === id);
    await cancelReminders(oldClass?.notificationIds);

    const memberName = members.find(m => m.id === (data.memberId || oldClass?.memberId))?.name || '未知';
    const updatedClass = { ...oldClass, ...data } as ClassItem;
    const ids = await scheduleClassReminders(updatedClass, memberName);

    // 乐观更新
    setClasses(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...data, notificationIds: ids } : c);
      storage.setClasses(updated);
      return updated;
    });

    const updateData: any = { ...data, notificationIds: ids };
    delete updateData.id;
    delete updateData.owner;

    const { error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating class (will retry):', error.message);
      await syncQueue.add({
        table: 'classes',
        type: 'update',
        payload: { id, ...updateData },
      });
    }
  }, [classes, members]);

  const handleDeleteClass = useCallback(async (id: string) => {
    console.log('Deleting class:', id);
    const oldClass = classes.find(c => c.id === id);
    await cancelReminders(oldClass?.notificationIds);

    // 乐观更新
    setClasses(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, isDeleted: true } : c);
      storage.setClasses(updated);
      return updated;
    });

    const { error } = await supabase
      .from('classes')
      .update({ isDeleted: true })
      .eq('id', id);

    if (error) {
      console.error('Error deleting class (will retry):', error.message);
      await syncQueue.add({
        table: 'classes',
        type: 'update',
        payload: { id, isDeleted: true },
      });
    }
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
      setClasses(prev => {
        const updated = prev.map(c => c.id === classId ? { ...c, doneLessons: nextDoneLessons, notificationIds: ids } : c);
        storage.setClasses(updated);
        return updated;
      });

      if (logData) {
        const newLog: LogItem = {
          id: logData[0].id.toString(),
          time: new Date(logData[0].created_at).toLocaleString(),
          text: logMessage,
        };
        setLogs(prev => {
          const updated = [newLog, ...prev];
          storage.setLogs(updated);
          return updated;
        });
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
