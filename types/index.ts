export interface Member {
  id: string;
  name: string;
  icon: string;
  themeColor: string;
  isDeleted?: boolean;
}

export interface ScheduleEntry {
  type: 'weekly' | 'specific';
  day?: number;    // 0-6
  date?: string;   // YYYY-MM-DD
  time: string;    // HH:mm
}

export interface ClassItem {
  id: string;
  memberId: string;
  name: string;
  totalPrice: number;
  totalLessons: number;
  doneLessons: number;
  schedule: ScheduleEntry[];
  unitType: 'lesson' | 'session';
  isDeleted?: boolean;
  notificationIds?: string[];
}

export interface LogItem {
  id: string;
  time: string;
  text: string;
  classId?: string;
}
