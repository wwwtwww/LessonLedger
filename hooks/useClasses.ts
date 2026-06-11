import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { ClassItem, LogItem, Member } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../utils/supabase';
import { storage } from '../utils/storage';
import { log } from '../utils/logger';
import { scheduleClassReminders, cancelReminders } from '../utils/notifications';
import { syncQueue } from '../utils/syncQueue';
import { generateUUID } from '../utils/uuid';
import { toLocalDateStr } from '../utils/formatters';
import { DEFAULT_CLASS_DURATION } from '../utils/colors';

export function useClasses(currentMemberId: string, members: Member[]) {
  const { t } = useLanguage();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pendingChanges = useRef(0);

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
      // 有未完成的写入操作时跳过覆盖，避免冲掉乐观更新
      if (pendingChanges.current === 0) {
        setClasses(formattedClasses);
        await storage.setClasses(formattedClasses);
      }
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

  const handleAddClass = useCallback(async (classItem: Omit<ClassItem, 'id' | 'doneLessons' | 'isDeleted' | 'owner' | 'notificationIds'> & { initialDoneLessons?: number }) => {
    pendingChanges.current++;
    log.info('useClasses', 'Adding class', classItem);
    const classId = generateUUID();
    const initialDone = classItem.initialDoneLessons || 0;

    const memberName = members.find(m => m.id === classItem.memberId)?.name || '未知';
    const duration = classItem.duration ?? DEFAULT_CLASS_DURATION;
    const newClass: ClassItem = { ...classItem, id: classId, doneLessons: initialDone, isDeleted: false, notificationIds: [], duration };
    let ids: string[] = [];
    try {
      ids = await scheduleClassReminders(newClass, memberName);
    } catch (e) {
      log.warn('useClasses', 'Failed to schedule reminders (non-critical)', e);
    }

    const newClassWithReminders = { ...newClass, notificationIds: ids };

    // 乐观更新
    setClasses(prev => {
      const updated = [...prev, newClassWithReminders];
      storage.setClasses(updated);
      return updated;
    });

    // 尝试同步
    const newClassPayload = { ...newClassWithReminders };
    const { error } = await supabase
      .from('classes')
      .insert([newClassPayload]);

    if (error) {
      log.warn('useClasses', 'Failed to add class online, queuing sync', { message: error.message });
      await syncQueue.add({
        table: 'classes',
        type: 'insert',
        payload: newClassPayload,
      });
    }
    pendingChanges.current--;
  }, [members]);

  const handleUpdateClass = useCallback(async (id: string, data: Partial<ClassItem>) => {
    pendingChanges.current++;
    log.info('useClasses', 'Updating class', { id, data });
    const oldClass = classes.find(c => c.id === id);

    let ids: string[] = [];
    try {
      await cancelReminders(oldClass?.notificationIds);
      const memberName = members.find(m => m.id === (data.memberId || oldClass?.memberId))?.name || '未知';
      const updatedClass = { ...oldClass, ...data } as ClassItem;
      ids = await scheduleClassReminders(updatedClass, memberName);
    } catch (e) {
      log.warn('useClasses', 'Failed to update reminders (non-critical)', e);
    }

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
      log.warn('useClasses', 'Failed to update class online, queuing sync', { message: error.message });
      await syncQueue.add({
        table: 'classes',
        type: 'update',
        payload: { id, ...updateData },
      });
    }
    pendingChanges.current--;
  }, [classes, members]);

  const handleDeleteClass = useCallback(async (id: string) => {
    pendingChanges.current++;
    log.info('useClasses', 'Deleting class', { id });
    const oldClass = classes.find(c => c.id === id);
    try { await cancelReminders(oldClass?.notificationIds); } catch {}

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
      log.warn('useClasses', 'Failed to delete class online, queuing sync', { message: error.message });
      await syncQueue.add({
        table: 'classes',
        type: 'update',
        payload: { id, isDeleted: true },
      });
    }
    pendingChanges.current--;
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

      try { await cancelReminders(item.notificationIds); } catch {}

      const nextDoneLessons = item.doneLessons + 1;
      const logMessage = `[${memberName}] ${className} -> -1 ${item.unitType === 'lesson' ? t.unitLesson : t.unitSession}`;

      const updatedClass = { ...item, doneLessons: nextDoneLessons };
      let ids: string[] = [];
      try { ids = await scheduleClassReminders(updatedClass, memberName); } catch {}

      // 乐观更新课程与日志状态
      const logId = generateUUID();
      const newLog: LogItem = {
        id: logId,
        time: new Date().toLocaleString(),
        text: logMessage,
        classId: classId,
      };

      setClasses(prev => {
        const updated = prev.map(c => c.id === classId ? { ...c, doneLessons: nextDoneLessons, notificationIds: ids } : c);
        storage.setClasses(updated);
        return updated;
      });

      setLogs(prev => {
        const updated = [newLog, ...prev];
        storage.setLogs(updated);
        return updated;
      });

      // 尝试向云端提交课程和日志
      const { error: updateError } = await supabase
        .from('classes')
        .update({ doneLessons: nextDoneLessons, notificationIds: ids })
        .eq('id', classId);

      if (updateError) {
        log.warn('useClasses', 'Failed to update check-in online, queueing sync', updateError);
        await syncQueue.add({
          table: 'classes',
          type: 'update',
          payload: { id: classId, doneLessons: nextDoneLessons, notificationIds: ids },
        });
        await syncQueue.add({
          table: 'logs',
          type: 'insert',
          payload: { id: logId, text: logMessage, class_id: classId },
        });
        return;
      }

      const { error: logError } = await supabase
        .from('logs')
        .insert([{ id: logId, text: logMessage, class_id: classId }]);

      if (logError) {
        log.warn('useClasses', 'Failed to insert log online, queueing sync', logError);
        await syncQueue.add({
          table: 'logs',
          type: 'insert',
          payload: { id: logId, text: logMessage, class_id: classId },
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

  // 带日期的打卡（补打卡）
  const handleCheckInWithDate = useCallback((classId: string, className: string, memberName: string, dateStr: string) => {
    const performAction = async () => {
      const item = classes.find(c => c.id === classId);
      if (!item || item.isDeleted) return;

      if (item.doneLessons >= item.totalLessons) {
        const errorMsg = t.noRemainingError;
        if (Platform.OS === 'web') alert(errorMsg);
        else Alert.alert('', errorMsg);
        return;
      }

      try { await cancelReminders(item.notificationIds); } catch {}

      const nextDoneLessons = item.doneLessons + 1;
      const logMessage = `[${memberName}] ${className} -> -1 ${item.unitType === 'lesson' ? t.unitLesson : t.unitSession}`;

      const updatedClass = { ...item, doneLessons: nextDoneLessons };
      let ids: string[] = [];
      try { ids = await scheduleClassReminders(updatedClass, memberName); } catch {}

      const logId = generateUUID();
      const newLog: LogItem = {
        id: logId,
        time: dateStr + ' ' + new Date().toLocaleTimeString(),
        text: logMessage,
        classId: classId,
      };

      setClasses(prev => {
        const updated = prev.map(c => c.id === classId ? { ...c, doneLessons: nextDoneLessons, notificationIds: ids } : c);
        storage.setClasses(updated);
        return updated;
      });

      setLogs(prev => {
        const updated = [newLog, ...prev];
        storage.setLogs(updated);
        return updated;
      });

      const { error: updateError } = await supabase
        .from('classes')
        .update({ doneLessons: nextDoneLessons, notificationIds: ids })
        .eq('id', classId);

      if (updateError) {
        log.warn('useClasses', 'Failed to update check-in online, queueing sync', updateError);
        await syncQueue.add({
          table: 'classes',
          type: 'update',
          payload: { id: classId, doneLessons: nextDoneLessons, notificationIds: ids },
        });
        await syncQueue.add({
          table: 'logs',
          type: 'insert',
          payload: { id: logId, text: logMessage, class_id: classId, created_at: dateStr },
        });
        return;
      }

      const { error: logError } = await supabase
        .from('logs')
        .insert([{ id: logId, text: logMessage, class_id: classId }]);

      if (logError) {
        log.warn('useClasses', 'Failed to insert log online, queueing sync', logError);
        await syncQueue.add({
          table: 'logs',
          type: 'insert',
          payload: { id: logId, text: logMessage, class_id: classId },
        });
      }
    };

    const msg = t.makeupCheckInMsg.replace('{date}', dateStr).replace('{course}', className);
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) performAction();
    } else {
      Alert.alert(t.makeupCheckInTitle, msg, [
        { text: t.cancel, style: 'cancel' },
        { text: t.confirm, onPress: performAction }
      ]);
    }
  }, [classes, t]);

  // 撤销打卡
  const handleUndoCheckIn = useCallback(async (logId: string, classId: string) => {
    const item = classes.find(c => c.id === classId);
    if (!item) return;

    const prevDoneLessons = Math.max(0, item.doneLessons - 1);
    const memberName = members.find(m => m.id === item.memberId)?.name || '未知';

    // 恢复通知
    const updatedClass = { ...item, doneLessons: prevDoneLessons };
    let ids: string[] = [];
    try { ids = await scheduleClassReminders(updatedClass, memberName); } catch {}

    // 乐观更新
    setClasses(prev => {
      const updated = prev.map(c => c.id === classId ? { ...c, doneLessons: prevDoneLessons, notificationIds: ids } : c);
      storage.setClasses(updated);
      return updated;
    });

    setLogs(prev => {
      const updated = prev.filter(l => l.id !== logId);
      storage.setLogs(updated);
      return updated;
    });

    // 云端同步
    const { error: updateError } = await supabase
      .from('classes')
      .update({ doneLessons: prevDoneLessons, notificationIds: ids })
      .eq('id', classId);

    if (updateError) {
      await syncQueue.add({
        table: 'classes',
        type: 'update',
        payload: { id: classId, doneLessons: prevDoneLessons, notificationIds: ids },
      });
    }

    const { error: deleteError } = await supabase
      .from('logs')
      .delete()
      .eq('id', logId);

    if (deleteError) {
      log.warn('useClasses', 'Failed to delete log online, queueing sync', deleteError);
    }
  }, [classes, members]);

  // 请假
  const handleSkipClass = useCallback(async (classId: string, className: string, memberName: string) => {
    const logId = generateUUID();
    const skipLog: LogItem = {
      id: logId,
      time: new Date().toLocaleString(),
      text: `[请假] ${memberName} ${className}`,
      classId: classId,
    };

    setLogs(prev => {
      const updated = [skipLog, ...prev];
      storage.setLogs(updated);
      return updated;
    });

    const { error } = await supabase
      .from('logs')
      .insert([{ id: logId, text: skipLog.text, class_id: classId }]);

    if (error) {
      log.warn('useClasses', 'Failed to insert skip log online, queueing sync', error);
      await syncQueue.add({
        table: 'logs',
        type: 'insert',
        payload: { id: logId, text: skipLog.text, class_id: classId },
      });
    }
  }, []);

  // 获取昨日未打卡课程列表
  const getYesterdayMissedClasses = useCallback(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDay = yesterday.getDay();
    const yesterdayDateStr = toLocalDateStr(yesterday);
    const yesterdayLocaleStr = yesterday.toLocaleDateString();

    return classes.filter(c => {
      if (c.isDeleted) return false;
      if (c.doneLessons >= c.totalLessons) return false;
      if (!c.schedule || c.schedule.length === 0) return false;

      const isScheduled = c.schedule.some(s =>
        (s.type === 'weekly' && s.day === yesterdayDay) ||
        (s.type === 'specific' && s.date === yesterdayDateStr)
      );
      if (!isScheduled) return false;

      const hasLog = logs.some(l => {
        if (l.classId !== c.id) return false;
        const logDate = new Date(l.time).toLocaleDateString();
        return logDate === yesterdayLocaleStr;
      });

      return !hasLog;
    }).map(c => ({
      ...c,
      memberName: members.find(m => m.id === c.memberId)?.name || 'Unknown',
    }));
  }, [classes, logs, members]);

  return {
    classes,
    filteredClasses,
    logs,
    stats,
    handleCheckIn,
    handleCheckInWithDate,
    handleUndoCheckIn,
    handleSkipClass,
    getYesterdayMissedClasses,
    handleAddClass,
    handleUpdateClass,
    handleDeleteClass,
    fetchData,
    isLoading
  };
}
