import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { COLORS } from '../../utils/colors';
import { ClassItem, Member } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';

interface WarningSectionProps {
  classes: ClassItem[];
  members: Member[];
  themeColor?: string;
  onCheckIn?: (classId: string) => void;
}

const WarningSection: React.FC<WarningSectionProps> = ({ classes, members, themeColor, onCheckIn }) => {
  const { t, lang } = useLanguage();
  
  // Spec: Only courses with remaining <= 3 and > 0
  const warningClasses = classes.filter(c => (c.totalLessons - c.doneLessons) <= 3 && (c.totalLessons - c.doneLessons) > 0);

  if (warningClasses.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{lang === 'zh-CN' ? '课程预警' : 'Course Warning'}</Text>
      {warningClasses.map((item) => {
        const remaining = item.totalLessons - item.doneLessons;
        const member = members.find(m => m.id === item.memberId);
        const progress = item.doneLessons / item.totalLessons;
        
        const handlePress = () => {
          triggerHaptic('medium');
          if (onCheckIn) {
            onCheckIn(item.id);
          }
        };

        return (
          <View key={item.id} style={styles.card}>
            {/* 1. Course Name */}
            <Text style={styles.courseName} numberOfLines={1}>{item.name}</Text>
            
            {/* 2. Member Badge */}
            <View style={styles.badgeWrapper}>
              <View style={[styles.badge, { backgroundColor: (member?.themeColor || COLORS.primary) + '15' }]}>
                <Text style={[styles.badgeText, { color: member?.themeColor || COLORS.primary }]}>
                  {member?.name || 'Member'}
                </Text>
              </View>
            </View>

            {/* 3. Progress Bar */}
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${Math.min(progress * 100, 100)}%`,
                    backgroundColor: themeColor || COLORS.primary 
                  }
                ]} 
              />
            </View>

            {/* 4. Remaining Count */}
            <Text style={styles.remainingCount}>
              {lang === 'zh-CN' ? `剩余 ${remaining} 节/次` : `Remaining: ${remaining}`}
            </Text>

            {/* 5. Action Button */}
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: COLORS.primary }]} 
              onPress={handlePress}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>{t.btnCheckIn}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24, // Spec: Position below Member Switcher, Margin Top: 24
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20, // Spec: Section Title 20 SemiBold
    fontWeight: '600',
    color: COLORS.textPrimary, // Spec: Text Primary
    marginBottom: 16,
  },
  card: {
    height: 160, // Spec: Height 160
    backgroundColor: '#FFFFFF',
    borderRadius: 24, // Spec: Radius 24
    padding: 20, // Spec: Padding 20
    marginBottom: 16,
    // Spec: Shadow rgba(0,0,0,0.08), y:8, blur:30
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.08)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 30,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 8px 30px rgba(0,0,0,0.08)',
      }
    }),
    justifyContent: 'space-between', // Ensures even distribution of the 5 elements
  },
  courseName: {
    fontSize: 18, // Spec: Course Title 18 SemiBold
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  badgeWrapper: {
    flexDirection: 'row', // To prevent badge from taking full width
  },
  badge: {
    height: 28, // Spec: Height 28
    borderRadius: 14, // Spec: Radius 14
    paddingHorizontal: 12, // Spec: Padding Horizontal 12
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8, // Spec: Height 8
    backgroundColor: '#F1F5F9',
    borderRadius: 999, // Spec: Radius 999
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  remainingCount: {
    fontSize: 13, // Spec: Caption 13 Regular
    color: COLORS.textSecondary, // Spec: Text Secondary
  },
  actionButton: {
    height: 48, // Spec: Height 48
    borderRadius: 16, // Spec: Radius 16
    width: '100%', // Spec: Width 100%
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WarningSection;
