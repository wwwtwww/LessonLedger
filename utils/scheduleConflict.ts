import { ClassItem, ScheduleEntry } from '../types';

export function hasScheduleConflict(
  newSchedule: ScheduleEntry[],
  newDuration: number = 60,
  existingClasses: ClassItem[]
): { conflict: boolean; conflictingClass?: string } {
  // Convert "HH:mm" to minutes since midnight
  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

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
    const existingDuration = existing.duration || 60;
    
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
        } else if (newBlock.type === 'weekly' && exEntry.type === 'specific' && newBlock.day === new Date(exEntry.date!).getDay()) {
            dayOverlap = true;
        } else if (newBlock.type === 'specific' && exEntry.type === 'weekly' && new Date(newBlock.date!).getDay() === exEntry.day) {
            dayOverlap = true;
        }

        if (dayOverlap) {
          // Check time overlap: Start A < End B && End A > Start B
          if (newBlock.start < exEnd && newBlock.end > exStart) {
            return { conflict: true, conflictingClass: existing.name };
          }
        }
      }
    }
  }

  return { conflict: false };
}
