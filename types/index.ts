export interface Member {
  id: string;
  name: string;
  icon: string;
  themeColor: string;
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
}

export interface LogItem {
  id: string;
  time: string;
  text: string;
}
