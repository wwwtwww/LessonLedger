import { ClassItem } from '../types';
import { COLORS } from './colors';

export const generateExpensePieData = (classes: ClassItem[], themeColor: string) => {
  if (classes.length === 0) return [{ value: 1, color: COLORS.border }];
  
  return classes.map((c, index) => ({
    value: c.totalPrice,
    color: index === 0 ? themeColor : `${themeColor}${Math.max(20, 90 - index * 20)}`, // 透明度渐变
    text: c.name,
  }));
};
