export interface Member {
  id: string;
  name: string;
  icon: string;
  themeColor: string;
  isDeleted?: boolean;
}

export interface ClassItem {
  id: string;
  memberId: string;
  name: string;
  totalPrice: number;
  totalLessons: number;
  doneLessons: number;
  schedule: string;
  unitType: 'lesson' | 'session';
  isDeleted?: boolean;
}

export interface LogItem {
  id: string;
  time: string;
  text: string;
}
