import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// eslint-disable-next-line import/no-unresolved
import { PieChart } from 'react-native-gifted-charts';
import { ClassItem } from '../../types';
import { generateExpensePieData } from '../../utils/chartData';
import { COLORS } from '../../utils/colors';
import { useLanguage } from '../../contexts/LanguageContext';

interface ExpensePieChartProps {
  classes: ClassItem[];
  themeColor: string;
}

export default function ExpensePieChart({ classes, themeColor }: ExpensePieChartProps) {
  const pieData = generateExpensePieData(classes, themeColor);
  const { t, lang } = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.expenseChartTitle}</Text>
      <View style={styles.chartWrapper}>
        <PieChart
          data={pieData}
          donut
          radius={80}
          innerRadius={50}
          centerLabelComponent={() => {
            const total = classes.reduce((sum, c) => sum + c.totalPrice, 0);
            return (
              <View style={styles.centerLabel}>
                <Text style={styles.centerText}>{t.total}</Text>
                <Text style={[styles.centerTotal, { color: themeColor }]}>
                  {lang === 'zh-CN' ? '￥' : '$'}{total}
                </Text>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  chartWrapper: { alignItems: 'center' },
  centerLabel: { justifyContent: 'center', alignItems: 'center' },
  centerText: { fontSize: 12, color: COLORS.textLight },
  centerTotal: { fontSize: 16, fontWeight: 'bold' },
});
