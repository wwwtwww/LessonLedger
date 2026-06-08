import { ClassItem } from '../types';
import { COLORS } from './colors';

const hexToRGBA = (hex: string, opacity: number) => {
  // 简易 6 位 Hex 解析（默认项目主题色为 6 位）
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const generateExpensePieData = (classes: ClassItem[], themeColor: string) => {
  if (classes.length === 0) return [{ value: 1, color: COLORS.border }];

  return classes.map((c, index) => ({
    value: c.totalPrice,
    color: index === 0 ? themeColor : hexToRGBA(themeColor, Math.max(0.2, 1 - index * 0.2)),
    text: c.name,
  }));
};
