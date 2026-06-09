import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS } from '../../utils/colors';
import SummaryCard from './SummaryCard';

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
// Padding for the parent container in index.tsx is 24
const CONTAINER_HORIZONTAL_PADDING = 24;
const GAP = 16;
// Calculate card width for 2x2 grid based on screen width and padding
const CARD_WIDTH = (Math.min(SCREEN_WIDTH, 430) - CONTAINER_HORIZONTAL_PADDING * 2 - GAP) / 2;

const FitnessSummaryCards: React.FC<FitnessSummaryCardsProps> = ({
  stats,
  themeColor = COLORS.primary,
}) => {
  const { lang, t } = useLanguage();
  const { totalSpent, totalClasses, totalRemaining, upcomingThisWeek } = stats;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <View style={{ width: CARD_WIDTH }}>
          <SummaryCard
            icon="💰"
            value={`${lang === 'zh-CN' ? '¥' : '$'}${totalSpent.toLocaleString()}`}
            label={t.totalInvestment}
          />
        </View>
        <View style={{ width: CARD_WIDTH }}>
          <SummaryCard
            icon="📚"
            value={totalClasses}
            label={t.activeProjects}
          />
        </View>
        <View style={{ width: CARD_WIDTH }}>
          <SummaryCard
            icon="⏳"
            value={totalRemaining}
            label={t.totalRemaining}
            color={themeColor}
          />
        </View>
        <View style={{ width: CARD_WIDTH }}>
          <SummaryCard
            icon="🗓️"
            value={upcomingThisWeek}
            label={t.upcomingThisWeek}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    justifyContent: 'center', // Center if screen is wider than 430px
  },
});

export default FitnessSummaryCards;
