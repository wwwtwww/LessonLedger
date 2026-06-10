import * as Notifications from 'expo-notifications';
import { ScheduleEntry, ClassItem } from '../types';
import { log } from './logger';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissionsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

function calculateNextTrigger(entry: ScheduleEntry): Date | null {
  const now = new Date();
  
  if (entry.type === 'specific' && entry.date) {
    const [hours, minutes] = entry.time.split(':').map(Number);
    const [year, month, day] = entry.date.split('-').map(Number);
    const triggerDate = new Date(year, month - 1, day, hours, minutes, 0);
    // Subtract 2 hours
    triggerDate.setHours(triggerDate.getHours() - 2);
    return triggerDate > now ? triggerDate : null;
  }
  
  if (entry.type === 'weekly' && entry.day !== undefined) {
    const [hours, minutes] = entry.time.split(':').map(Number);
    const triggerDate = new Date();
    triggerDate.setHours(hours, minutes, 0, 0);
    
    // Find next matching day
    const currentDay = triggerDate.getDay();
    let daysToAdd = entry.day - currentDay;
    if (daysToAdd < 0) {
      daysToAdd += 7; // Next week
    }
    
    triggerDate.setDate(triggerDate.getDate() + daysToAdd);
    
    // Subtract 2 hours
    triggerDate.setHours(triggerDate.getHours() - 2);
    
    // If the trigger time is already in the past, schedule for next week
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 7);
    }
    
    return triggerDate;
  }
  
  return null;
}

export async function scheduleClassReminders(classItem: ClassItem, memberName: string): Promise<string[]> {
  const notificationIds: string[] = [];
  
  if (!classItem.schedule || classItem.schedule.length === 0) return notificationIds;

  for (const entry of classItem.schedule) {
    const triggerDate = calculateNextTrigger(entry);
    
    if (triggerDate) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🎒 上课提醒：${classItem.name}`,
          body: `${memberName} 的 ${classItem.name} 将在 ${entry.time} 开始，不要迟到哦！（剩余: ${classItem.totalLessons - classItem.doneLessons}次）`,
          data: { classId: classItem.id },
        },
        trigger: {
          type: 'date',
          date: triggerDate,
        } as Notifications.NotificationTriggerInput,
      });
      notificationIds.push(id);
    }
  }
  
  return notificationIds;
}

export async function cancelReminders(ids?: string[]) {
  if (!ids || ids.length === 0) return;
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      log.error('notifications', 'Failed to cancel notification', { id });
    }
  }
}
