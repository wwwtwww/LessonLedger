import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../utils/colors';
import { ClassItem } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface WarningSectionProps {
  classes: ClassItem[];
  themeColor?: string;
}

const WarningSection: React.FC<WarningSectionProps> = ({ classes, themeColor }) => {
  const { t, lang } = useLanguage();
  // Only show classes with 3 or fewer lessons remaining and still have remaining lessons
  const warningClasses = classes.filter(c => (c.totalLessons - c.doneLessons) <= 3 && (c.totalLessons - c.doneLessons) > 0);

  if (warningClasses.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{lang === 'zh-CN' ? '⚠️ 临近结课' : '⚠️ Low Lessons Warning'}</Text>
      {warningClasses.map((item) => {
        const remaining = item.totalLessons - item.doneLessons;
        return (
          <View key={item.id} style={styles.warningRow}>
            <View style={[styles.indicator, { backgroundColor: themeColor || COLORS.danger }]} />
            <Text style={styles.className} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.remainingText}>
              {t.remain} <Text style={styles.highlight}>{remaining}</Text> {item.unitType === 'session' ? t.unitSession : t.unitLesson}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.danger + '40', // Semi-transparent danger color for border
    marginBottom: 8,
  },
  indicator: {
    width: 3,
    height: 14,
    borderRadius: 2,
    marginRight: 10,
  },
  className: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  remainingText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  highlight: {
    fontWeight: '800',
    color: COLORS.danger,
    fontSize: 15,
  },
});

export default WarningSection;
