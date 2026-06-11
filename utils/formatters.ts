import { ScheduleEntry } from '../types';

const DAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Date → YYYY-MM-DD（本地时间）
 * 使用本地 getFullYear/getMonth/getDate 而非 toISOString，
 * 避免 new Date().toISOString() 在跨时区时偏移一天
 */
export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 安全解析 YYYY-MM-DD 为本地日期并返回星期几（0=周日）
 * 避免 new Date("2026-06-10") 被解析为 UTC 午夜导致跨时区偏移
 */
export function getLocalDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

export function formatSchedule(schedule: ScheduleEntry[] | string, lang: 'zh-CN' | 'en-US' = 'zh-CN') {
  if (!schedule) return lang === 'zh-CN' ? '未设置时间' : 'No Schedule';
  
  // 兼容老数据的 fallback
  if (typeof schedule === 'string') {
    return schedule;
  }

  if (schedule.length === 0) return lang === 'zh-CN' ? '未设置时间' : 'No Schedule';

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
    const uniqueDays = Array.from(new Set(days)).sort((a, b) => a - b);
    const dayStr = uniqueDays.map(d => daysMap[d]).join('/');
    return lang === 'zh-CN' ? `周${dayStr} ${time}` : `${dayStr} ${time}`;
  });

  const formattedSpecific = specific.map(entry => {
    return `${entry.date} ${entry.time}`;
  });

  return [...formattedWeekly, ...formattedSpecific].join(', ');
}