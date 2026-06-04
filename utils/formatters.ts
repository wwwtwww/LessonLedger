import { ScheduleEntry } from '../types';

const DAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatSchedule(schedule: ScheduleEntry[] | string, lang: 'zh-CN' | 'en-US' = 'zh-CN') {
  if (!schedule) return '未设置时间';
  
  // 兼容老数据的 fallback
  if (typeof schedule === 'string') {
    return schedule;
  }

  if (schedule.length === 0) return '未设置时间';

  const daysMap = lang === 'zh-CN' ? DAYS_ZH : DAYS_EN;
  
  const weekly = schedule.filter(s => s.type === 'weekly');
  const specific = schedule.filter(s => s.type === 'specific');

  // Group weekly by time
  const weeklyGroups: Record<string, number[]> = {};
  weekly.forEach(entry => {
    if (entry.day !== undefined) {
      if (!weeklyGroups[entry.time]) weeklyGroups[entry.time] = [];
      weeklyGroups[entry.time].push(entry.day);
    }
  });

  const formattedWeekly = Object.entries(weeklyGroups).map(([time, days]) => {
    days.sort((a, b) => a - b);
    const dayStr = days.map(d => daysMap[d]).join('/');
    return lang === 'zh-CN' ? `周${dayStr} ${time}` : `${dayStr} ${time}`;
  });

  const formattedSpecific = specific.map(entry => {
    return `${entry.date} ${entry.time}`;
  });

  return [...formattedWeekly, ...formattedSpecific].join(', ');
}