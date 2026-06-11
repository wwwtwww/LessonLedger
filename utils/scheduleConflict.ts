import { ClassItem, ScheduleEntry } from '../types';
import { getLocalDayOfWeek } from './formatters';
import { DEFAULT_CLASS_DURATION } from './colors';

export function hasScheduleConflict(
  newSchedule: ScheduleEntry[],
  newDuration: number = DEFAULT_CLASS_DURATION,
  existingClasses: ClassItem[]
): { conflict: boolean; conflictingClass?: string } {
  // Convert "HH:mm" to minutes since midnight
  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // 一天的分钟数
  const DAY_MINUTES = 24 * 60;

  const newBlocks = newSchedule.map(s => {
    const start = timeToMinutes(s.time);
    return {
      type: s.type,
      day: s.day,
      date: s.date,
      start,
      end: start + newDuration
    };
  });

  for (const existing of existingClasses) {
    if (existing.isDeleted) continue;
    const existingDuration = existing.duration || DEFAULT_CLASS_DURATION;
    
    for (const exEntry of existing.schedule) {
      const exStart = timeToMinutes(exEntry.time);
      const exEnd = exStart + existingDuration;

      for (const newBlock of newBlocks) {
        // Check if days overlap (simplified: assume specific dates don't easily cross weekly without full date math, 
        // for MVP we check if both are weekly and same day, or specific on same date)
        let dayOverlap = false;
        if (newBlock.type === 'weekly' && exEntry.type === 'weekly' && newBlock.day === exEntry.day) {
            dayOverlap = true;
        } else if (newBlock.type === 'specific' && exEntry.type === 'specific' && newBlock.date === exEntry.date) {
            dayOverlap = true;
        } else if (newBlock.type === 'weekly' && exEntry.type === 'specific' && newBlock.day === getLocalDayOfWeek(exEntry.date!)) {
            dayOverlap = true;
        } else if (newBlock.type === 'specific' && exEntry.type === 'weekly' && getLocalDayOfWeek(newBlock.date!) === exEntry.day) {
            dayOverlap = true;
        }

        if (dayOverlap) {
          // 基础重叠检测：Start_A < End_B && End_A > Start_B
          if (newBlock.start < exEnd && newBlock.end > exStart) {
            return { conflict: true, conflictingClass: existing.name };
          }
          // 跨午夜修正：若新时段 end 超过 24:00，将溢出部分(0~end-DAY_MINUTES)做一次重叠检测
          if (newBlock.end > DAY_MINUTES) {
            const wrappedEnd = newBlock.end - DAY_MINUTES;
            if (0 < exEnd && wrappedEnd > exStart) {
              return { conflict: true, conflictingClass: existing.name };
            }
          }
          // 同样检查已有课程是否跨午夜
          if (exEnd > DAY_MINUTES) {
            const wrappedEnd = exEnd - DAY_MINUTES;
            if (newBlock.start < wrappedEnd && newBlock.end > 0) {
              return { conflict: true, conflictingClass: existing.name };
            }
          }
        }
      }
    }
  }

  return { conflict: false };
}
