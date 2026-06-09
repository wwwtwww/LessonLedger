import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableWithoutFeedback, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../../utils/colors';
import { ClassItem, Member } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';

interface WarningCardProps {
  item: ClassItem;
  member?: Member;
  themeColor?: string;
  onCheckIn?: (classId: string) => void;
  lang: string;
  t: any;
}

const WarningCard: React.FC<WarningCardProps> = ({ item, member, themeColor, onCheckIn, lang, t }) => {
  const remaining = item.totalLessons - item.doneLessons;
  const progress = item.doneLessons / item.totalLessons;
  
  // Animation values
  const scale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Progress bar animation: 250ms, easeOut
    progressWidth.value = withTiming(progress, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [progress]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${Math.min(progressWidth.value * 100, 100)}%`,
  }));

  const handlePressIn = () => {
    // Press feedback: Scale 1.0 -> 0.97, 120ms
    scale.value = withTiming(0.97, { duration: 120 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 120 });
  };

  const handlePress = () => {
    triggerHaptic('light');
    if (onCheckIn) {
      onCheckIn(item.id);
    }
  };

  const isUrgent = remaining <= 3;

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[styles.card, cardAnimatedStyle]}>
        {/* 1. Course Name (18px SemiBold) */}
        <Text style={styles.courseName} numberOfLines={1}>{item.name}</Text>

        {/* 2. Member Badge (28x28px, Radius 14px) */}
        <View style={styles.badgeRow}>
          <View style={[styles.memberBadge, { backgroundColor: (member?.themeColor || COLORS.primary) + '15' }]}>
             <Text style={[styles.memberBadgeText, { color: member?.themeColor || COLORS.primary }]}>
                {member?.name?.charAt(0) || 'M'}
             </Text>
          </View>
          <Text style={styles.memberNameText}>{member?.name || 'Member'}</Text>
        </View>

        {/* 3. Progress Bar (Height 8px, Radius 999) */}
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { backgroundColor: themeColor || COLORS.primary },
              progressAnimatedStyle
            ]}
          />
        </View>

        {/* 4. Remaining Count (15px Regular, Highlight if <= 3) */}
        <Text style={[styles.remainingCount, isUrgent && styles.urgentText]}>
          {lang === 'zh-CN' ? `剩余 ${remaining} 节/次` : `Remaining: ${remaining}`}
        </Text>

        {/* 5. Action Button (Height 48px, Radius 16px, Width 100%) */}
        <View style={[styles.actionButton, { backgroundColor: themeColor || COLORS.primary }]}>
          <Text style={styles.buttonText}>{t.btnCheckIn}</Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

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
    <View style={[styles.container, { gap: 16 }]}>
      <Text style={styles.sectionTitle}>{lang === 'zh-CN' ? '课程预警' : 'Course Warning'}</Text>
      {warningClasses.map((item) => {
        const member = members.find(m => m.id === item.memberId);
        return (
          <WarningCard 
            key={item.id} 
            item={item} 
            member={member} 
            themeColor={themeColor} 
            onCheckIn={onCheckIn}
            lang={lang}
            t={t}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 0, // Changed from 16 since we use gap: 16 on container
  },
  card: {
    height: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    // marginBottom removed
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 30,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 8px 30px rgba(0,0,0,0.08)',
      }
    }),
    justifyContent: 'space-between',
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  memberNameText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  remainingCount: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  urgentText: {
    color: COLORS.danger,
    fontWeight: '600',
  },
  actionButton: {
    height: 48,
    borderRadius: 16,
    width: '100%',
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
