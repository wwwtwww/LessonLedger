import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS } from '../../utils/colors';

interface FitnessSummaryCardsProps {
  stats: {
    totalSpent: number;
    totalClasses: number;
    totalRemaining: number;
  };
  themeColor?: string;
  onRemainingPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CONTAINER_PADDING = 20;
// 计算 Web 端 (max 600) 和手机端的卡片宽度
const CARD_WIDTH = (Math.min(SCREEN_WIDTH, 600) - CONTAINER_PADDING * 2 - CARD_GAP) / 2;

const FitnessSummaryCards: React.FC<FitnessSummaryCardsProps> = ({ 
  stats, 
  themeColor = COLORS.primary,
  onRemainingPress 
}) => {
  const { lang, t } = useLanguage();
  const { totalSpent, totalRemaining } = stats;

  return (
    <View style={styles.container}>
      {/* 左侧卡片：累计学费投入 (Gradient) */}
      <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
        <LinearGradient
          colors={[themeColor, themeColor + 'CC', themeColor + '80']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCard}
        >
          <View style={styles.content}>
            <Text style={styles.label}>{t.totalInvestment}</Text>
            <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
              {lang === 'zh-CN' ? '¥' : '$'}{totalSpent.toLocaleString()}
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* 右侧卡片：全家剩余总课时 (BlurView / 入口) */}
      <TouchableOpacity 
        style={[styles.cardWrapper, { width: CARD_WIDTH }]}
        onPress={onRemainingPress}
        activeOpacity={0.8}
      >
        <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint="light" style={styles.blurCard}>
          <View style={styles.content}>
            <Text style={[styles.label, { color: COLORS.textLight }]}>{t.totalRemaining}</Text>
            <Text style={[styles.value, { color: themeColor }]} numberOfLines={1} adjustsFontSizeToFit>
              {totalRemaining}
            </Text>
          </View>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginBottom: 24, // 严格对齐 24px 间距
  },
  cardWrapper: {
    height: 120,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  gradientCard: {
    flex: 1,
  },
  blurCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default FitnessSummaryCards;
