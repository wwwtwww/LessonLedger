import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';

interface SummaryCardProps {
  stats: {
    totalSpent: number;
    totalClasses: number;
    totalRemaining: number;
  };
}

const SummaryCard: React.FC<SummaryCardProps> = ({ stats }) => {
  const { lang, t } = useLanguage();
  const { totalSpent, totalClasses, totalRemaining } = stats;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryNum}>{lang === 'zh-CN' ? '￥' : '$'}{totalSpent}</Text>
        <Text style={styles.summaryLabel}>{t.totalInvestment}</Text>
      </View>
      <View style={[styles.summaryItem, styles.summaryBorder]}>
        <Text style={styles.summaryNum}>{totalClasses}</Text>
        <Text style={styles.summaryLabel}>{t.activeProjects}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryNum}>{totalRemaining}</Text>
        <Text style={styles.summaryLabel}>{t.totalRemaining}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: { 
    backgroundColor: '#1E293B', 
    borderRadius: 20, 
    padding: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryBorder: { 
    borderLeftWidth: 1, 
    borderRightWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.15)' 
  },
  summaryNum: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  summaryLabel: { fontSize: 11, color: '#94A3B8' },
});

export default SummaryCard;
