import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS } from '../../utils/colors';

interface FitnessSummaryCardsProps {
  stats: {
    totalSpent: number;
    totalClasses: number;
    totalRemaining: number;
    upcomingThisWeek: number;
  };
  themeColor?: string;
}

const FitnessSummaryCards: React.FC<FitnessSummaryCardsProps> = ({
  stats,
  themeColor = COLORS.primary,
}) => {
  const { lang } = useLanguage();
  const { totalSpent, totalClasses, totalRemaining } = stats;
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.unifiedCard}>
        {/* Column 1: Total Spent */}
        <View style={styles.column}>
          <View style={[styles.iconWrapper, { backgroundColor: '#F0F9FF' }]}>
            <Text style={styles.iconText}>¥</Text>
          </View>
          <Text style={styles.label}>{lang === 'zh-CN' ? '总支出' : 'Total Expense'}</Text>
          <Text style={[styles.value, { color: '#0F172A' }]}>
            {lang === 'zh-CN' ? '¥' : '$'}{totalSpent.toLocaleString()}
          </Text>
        </View>

        {/* Column 2: Total Classes */}
        <View style={styles.column}>
          <View style={[styles.iconWrapper, { backgroundColor: '#F0FDF4' }]}>
            <Text style={styles.iconText}>✓</Text>
          </View>
          <Text style={styles.label}>{lang === 'zh-CN' ? '总消耗课时' : 'Consumed'}</Text>
          <Text style={[styles.value, { color: '#22C55E' }]}>{totalClasses}</Text>
        </View>

        {/* Column 3: Total Remaining (Navigates to Courses) */}
        <TouchableOpacity 
          style={styles.column} 
          onPress={() => router.push('/courses')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#EEF2FF' }]}>
            <Text style={styles.iconText}>⏳</Text>
          </View>
          <Text style={styles.label}>{lang === 'zh-CN' ? '剩余课时' : 'Remaining'}</Text>
          <Text style={[styles.value, { color: '#6366F1' }]}>{totalRemaining}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  unifiedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  column: {
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default FitnessSummaryCards;
