import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = 24;
const GAP = 16;
const CARD_WIDTH = (Math.min(SCREEN_WIDTH, 430) - CONTAINER_PADDING * 2 - GAP) / 2;

const SummaryCard: React.FC<{
  icon: string;
  value: string | number;
  label: string;
  color?: string;
}> = ({ icon, value, label, color = COLORS.textPrimary }) => (
  <View style={styles.card}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const FitnessSummaryCards: React.FC<FitnessSummaryCardsProps> = ({
  stats,
  themeColor = COLORS.primary,
}) => {
  const { lang, t } = useLanguage();
  const { totalSpent, totalClasses, totalRemaining, upcomingThisWeek } = stats;

  return (
    <View style={styles.container}>
      <SummaryCard
        icon="💰"
        value={`${lang === 'zh-CN' ? '¥' : '$'}${totalSpent.toLocaleString()}`}
        label={t.totalInvestment}
      />
      <SummaryCard
        icon="📚"
        value={totalClasses}
        label={t.activeProjects}
      />
      <SummaryCard
        icon="⏳"
        value={totalRemaining}
        label={t.totalRemaining}
        color={themeColor}
      />
      <SummaryCard
        icon="🗓️"
        value={upcomingThisWeek}
        label={t.upcomingThisWeek}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: GAP,
    marginTop: 24,
  },
  card: {
    width: CARD_WIDTH,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // Spec: y: 8, blur: 30, opacity: 0.08
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 15, // Approx for 30 blur
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default FitnessSummaryCards;
